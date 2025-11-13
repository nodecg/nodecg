import { rootPaths } from "@nodecg/internal-util/sync";
import express from "express";
import fs from "fs";
import path from "path";

import type { NodeCG } from "../../types/nodecg";
import type { GraphicRegRequest, RootNS } from "../../types/socket-protocol";
import type { BundleManager } from "../bundle-manager";
import type { Replicator } from "../replicant/replicator";
import type { ServerReplicant } from "../replicant/server-replicant";
import { injectScripts } from "../util/injectscripts";
import { isChildPath } from "../util/is-child-path";

type GraphicsInstance = NodeCG.GraphicsInstance;

const BUILD_PATH = path.join(
	rootPaths.nodecgInstalledPath,
	"dist/client/instance",
);

export class RegistrationCoordinator {
	app = express();

	private readonly _instancesRep: ServerReplicant<
		GraphicsInstance[],
		NodeCG.Replicant.OptionsWithDefault<GraphicsInstance[]>
	>;

	private readonly _bundleManager: BundleManager;

	constructor(
		io: RootNS,
		bundleManager: BundleManager,
		replicator: Replicator,
	) {
		this._bundleManager = bundleManager;
		const { app } = this;

		this._instancesRep = replicator.declare("graphics:instances", "nodecg", {
			schemaPath: path.join(
				rootPaths.nodecgInstalledPath,
				"schemas/graphics%3Ainstances.json",
			),
			persistent: false,
			defaultValue: [],
		});

		bundleManager.on("bundleChanged", this._updateInstanceStatuses.bind(this));
		bundleManager.on("gitChanged", this._updateInstanceStatuses.bind(this));

		io.on("connection", (socket) => {
			socket.on("graphic:registerSocket", (regRequest, cb) => {
				const { bundleName } = regRequest;
				let { pathName } = regRequest;
				if (pathName.endsWith(`/${bundleName}/graphics/`)) {
					pathName += "index.html";
				}

				const bundle = bundleManager.find(bundleName);
				/* istanbul ignore if: simple error trapping */
				if (!bundle) {
					cb(undefined, false);
					return;
				}

				const graphicManifest = this._findGraphicManifest({
					bundleName,
					pathName,
				});

				/* istanbul ignore if: simple error trapping */
				if (!graphicManifest) {
					cb(undefined, false);
					return;
				}

				const existingSocketRegistration = this._findRegistrationBySocketId(
					socket.id,
				);
				const existingPathRegistration =
					this._findOpenRegistrationByPathName(pathName);

				// If there is an existing registration with this pathName,
				// and this is a singleInstance graphic,
				// then deny the registration, unless the socket ID matches.
				if (existingPathRegistration && graphicManifest.singleInstance) {
					if (existingPathRegistration.socketId === socket.id) {
						cb(undefined, true);
						return;
					}

					cb(undefined, !existingPathRegistration.open);
					return;
				}

				if (existingSocketRegistration) {
					existingSocketRegistration.open = true;
				} else {
					this._addRegistration({
						...regRequest,
						ipv4: socket.request.socket.remoteAddress!,
						socketId: socket.id,
						singleInstance: Boolean(graphicManifest.singleInstance),
						potentiallyOutOfDate:
							calcBundleGitMismatch(bundle, regRequest) ||
							calcBundleVersionMismatch(bundle, regRequest),
						open: true,
					});

					if (graphicManifest.singleInstance) {
						app.emit("graphicOccupied", pathName);
					}
				}

				cb(undefined, true);
			});

			socket.on("graphic:queryAvailability", (pathName, cb) => {
				cb(undefined, !this._findOpenRegistrationByPathName(pathName));
			});

			socket.on("graphic:requestBundleRefresh", (bundleName, cb) => {
				const bundle = bundleManager.find(bundleName);
				if (!bundle) {
					cb(undefined, undefined);
					return;
				}

				io.emit("graphic:bundleRefresh", bundleName);
				cb(undefined, undefined);
			});

			socket.on("graphic:requestRefreshAll", (graphic, cb) => {
				io.emit("graphic:refreshAll", graphic);
				if (typeof cb === "function") {
					cb(undefined, undefined);
				}
			});

			socket.on("graphic:requestRefresh", (instance, cb) => {
				io.emit("graphic:refresh", instance);
				cb(undefined, undefined);
			});

			socket.on("graphic:requestKill", (instance, cb) => {
				io.emit("graphic:kill", instance);
				cb(undefined, undefined);
			});

			socket.on("disconnect", () => {
				// Unregister the socket.
				const registration = this._findRegistrationBySocketId(socket.id);
				if (!registration) {
					return;
				}

				registration.open = false;
				if (registration.singleInstance) {
					app.emit("graphicAvailable", registration.pathName);
				}

				setTimeout(() => {
					this._removeRegistration(socket.id);
				}, 1000);
			});
		});

		app.get("/instance/*", (req, res, next) => {
			const resName = req.path.split("/").slice(2).join("/");

			// If it's a HTML file, inject the graphic setup script and serve that
			// otherwise, send the file unmodified
			const fileLocation = path.join(BUILD_PATH, resName);
			if (resName.endsWith(".html") && isChildPath(BUILD_PATH, fileLocation)) {
				if (fs.existsSync(fileLocation)) {
					injectScripts(fileLocation, "graphic", {}, (html) => res.send(html));
				} else {
					next();
				}
			} else {
				next();
			}
		});
	}

	private _addRegistration(registration: GraphicsInstance): void {
		this._instancesRep.value.push({
			...registration,
			open: true,
		});
	}

	private _removeRegistration(socketId: string): GraphicsInstance | false {
		const registrationIndex = this._instancesRep.value.findIndex(
			(instance) => instance.socketId === socketId,
		);

		/* istanbul ignore next: simple error trapping */
		if (registrationIndex < 0) {
			return false;
		}

		return this._instancesRep.value.splice(registrationIndex, 1)[0]!;
	}

	private _findRegistrationBySocketId(
		socketId: string,
	): GraphicsInstance | undefined {
		return this._instancesRep.value.find(
			(instance) => instance.socketId === socketId,
		);
	}

	private _findOpenRegistrationByPathName(
		pathName: string,
	): GraphicsInstance | undefined {
		return this._instancesRep.value.find(
			(instance) => instance.pathName === pathName && instance.open,
		);
	}

	private _updateInstanceStatuses(): void {
		this._instancesRep.value.forEach((instance) => {
			const { bundleName, pathName } = instance;
			const bundle = this._bundleManager.find(bundleName);
			/* istanbul ignore next: simple error trapping */
			if (!bundle) {
				return;
			}

			const graphicManifest = this._findGraphicManifest({
				bundleName,
				pathName,
			});
			/* istanbul ignore next: simple error trapping */
			if (!graphicManifest) {
				return;
			}

			instance.potentiallyOutOfDate =
				calcBundleGitMismatch(bundle, instance) ||
				calcBundleVersionMismatch(bundle, instance);
			instance.singleInstance = Boolean(graphicManifest.singleInstance);
		});
	}

	private _findGraphicManifest({
		pathName,
		bundleName,
	}: {
		pathName: string;
		bundleName: string;
	}): NodeCG.Bundle.Graphic | undefined {
		const bundle = this._bundleManager.find(bundleName);
		/* istanbul ignore if: simple error trapping */
		if (!bundle) {
			return;
		}

		return bundle.graphics.find((graphic) => graphic.url === pathName);
	}
}

function calcBundleGitMismatch(
	bundle: NodeCG.Bundle,
	regRequest: GraphicRegRequest,
): boolean {
	if (regRequest.bundleGit && !bundle.git) {
		return true;
	}

	if (!regRequest.bundleGit && bundle.git) {
		return true;
	}

	if (!regRequest.bundleGit && !bundle.git) {
		return false;
	}

	return regRequest.bundleGit!.hash !== bundle.git!.hash;
}

function calcBundleVersionMismatch(
	bundle: NodeCG.Bundle,
	regRequest: GraphicRegRequest,
): boolean {
	return bundle.version !== regRequest.bundleVersion;
}
