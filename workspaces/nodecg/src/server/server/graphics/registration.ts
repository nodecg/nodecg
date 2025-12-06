import { rootPaths } from "@nodecg/internal-util";
import { Effect, Stream } from "effect";
import express from "express";
import fs from "fs";
import path from "path";

import type { NodeCG } from "../../../types/nodecg.js";
import type {
	GraphicRegRequest,
	RootNS,
} from "../../../types/socket-protocol.js";
import type { Replicator } from "../../replicant/replicator.js";
import type { ServerReplicant } from "../../replicant/server-replicant.js";
import { injectScripts } from "../../util/injectscripts.js";
import { isChildPath } from "../../util/is-child-path.js";
import { BundleManager } from "../bundle-manager.js";

type GraphicsInstance = NodeCG.GraphicsInstance;

const BUILD_PATH = path.join(
	rootPaths.nodecgInstalledPath,
	"dist/client/instance",
);

type InstanceRep = ServerReplicant<
	GraphicsInstance[],
	NodeCG.Replicant.OptionsWithDefault<GraphicsInstance[]>
>;

export const registrationCoordinator = Effect.fn("registrationCoordinator")(
	function* (io: RootNS, replicator: Replicator) {
		const bundleManager = yield* BundleManager;

		const app = express();

		const instancesRep: InstanceRep = replicator.declare(
			"graphics:instances",
			"nodecg",
			{
				schemaPath: path.join(
					rootPaths.nodecgInstalledPath,
					"schemas/graphics%3Ainstances.json",
				),
				persistent: false,
				defaultValue: [],
			},
		);

		const bundleEvents = yield* bundleManager
			.subscribe()
			.pipe(
				Effect.map(
					Stream.filter(
						(event) =>
							event._tag === "bundleChanged" || event._tag === "gitChanged",
					),
				),
			);
		yield* Effect.forkScoped(
			bundleEvents.pipe(
				Stream.runForEach(() => Effect.sync(updateInstanceStatuses)),
			),
		);

		io.on("connection", (socket) => {
			socket.on("graphic:registerSocket", (regRequest, cb) => {
				const { bundleName } = regRequest;
				let { pathName } = regRequest;
				if (pathName.endsWith(`/${bundleName}/graphics/`)) {
					pathName += "index.html";
				}

				const bundle = bundleManager.find(bundleName);
				if (!bundle) {
					cb(undefined, false);
					return;
				}

				const graphicManifest = findGraphicManifest({
					bundleName,
					pathName,
				});

				if (!graphicManifest) {
					cb(undefined, false);
					return;
				}

				const existingSocketRegistration = findRegistrationBySocketId(
					socket.id,
				);
				const existingPathRegistration =
					findOpenRegistrationByPathName(pathName);

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
					addRegistration({
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
				cb(undefined, !findOpenRegistrationByPathName(pathName));
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
				const registration = findRegistrationBySocketId(socket.id);
				if (!registration) {
					return;
				}

				registration.open = false;
				if (registration.singleInstance) {
					app.emit("graphicAvailable", registration.pathName);
				}

				setTimeout(() => {
					removeRegistration(socket.id);
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

		function addRegistration(registration: GraphicsInstance): void {
			instancesRep.value.push({
				...registration,
				open: true,
			});
		}

		function removeRegistration(socketId: string): GraphicsInstance | false {
			const registrationIndex = instancesRep.value.findIndex(
				(instance) => instance.socketId === socketId,
			);

			if (registrationIndex < 0) {
				return false;
			}

			return instancesRep.value.splice(registrationIndex, 1)[0]!;
		}

		function findRegistrationBySocketId(
			socketId: string,
		): GraphicsInstance | undefined {
			return instancesRep.value.find(
				(instance) => instance.socketId === socketId,
			);
		}

		function findOpenRegistrationByPathName(
			pathName: string,
		): GraphicsInstance | undefined {
			return instancesRep.value.find(
				(instance) => instance.pathName === pathName && instance.open,
			);
		}

		function updateInstanceStatuses(): void {
			instancesRep.value.forEach((instance) => {
				const { bundleName, pathName } = instance;
				const bundle = bundleManager.find(bundleName);
				if (!bundle) {
					return;
				}

				const graphicManifest = findGraphicManifest({
					bundleName,
					pathName,
				});
				if (!graphicManifest) {
					return;
				}

				instance.potentiallyOutOfDate =
					calcBundleGitMismatch(bundle, instance) ||
					calcBundleVersionMismatch(bundle, instance);
				instance.singleInstance = Boolean(graphicManifest.singleInstance);
			});
		}

		function findGraphicManifest({
			pathName,
			bundleName,
		}: {
			pathName: string;
			bundleName: string;
		}): NodeCG.Bundle.Graphic | undefined {
			const bundle = bundleManager.find(bundleName);
			if (!bundle) {
				return;
			}

			return bundle.graphics.find((graphic) => graphic.url === pathName);
		}

		return app;
	},
);

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
