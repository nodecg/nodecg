import fs from "node:fs";
import path, { extname } from "node:path";

import { rootPaths } from "@nodecg/internal-util";
import { Array, Effect, GroupBy, Stream } from "effect";
import express from "express";
import hasha from "hasha";
import multer from "multer";
import { z } from "zod";

import { stringifyError } from "../../shared/utils/errors";
import type { NodeCG } from "../../types/nodecg";
import {
	getWatcher,
	listenToAdd,
	listenToChange,
	listenToError,
	listenToUnlink,
	waitForReady,
} from "../_effect/chokidar";
import type { BundleManager } from "./bundle-manager";
import { createLogger } from "../logger";
import type { Replicator } from "../replicant/replicator";
import type { ServerReplicant } from "../replicant/server-replicant";
import { authCheck } from "../util/authcheck";
import { sendFile } from "../util/send-file";

interface Collection {
	name: string;
	categories: NodeCG.Bundle.AssetCategory[];
}

const logger = createLogger("assets");

const getAssetsPath = () => path.join(rootPaths.getRuntimeRoot(), "assets");

const createAssetFile = (filepath: string, sum: string): NodeCG.AssetFile => {
	const parsedPath = path.parse(filepath);
	const parts = parsedPath.dir
		.replace(getAssetsPath() + path.sep, "")
		.split(path.sep);

	return {
		sum,
		base: parsedPath.base,
		ext: parsedPath.ext,
		name: parsedPath.name,
		namespace: parts[0]!,
		category: parts[1]!,
		url: `/assets/${parts[0]}/${parts[1]}/${encodeURIComponent(parsedPath.base)}`,
	};
};

const prepareNamespaceAssetsPath = (namespace: string) => {
	const assetsPath = path.join(getAssetsPath(), namespace);

	if (!fs.existsSync(assetsPath)) {
		fs.mkdirSync(assetsPath);
	}

	return assetsPath;
};

export const assetsRouter = Effect.fn("assetsRouter")(function* (
	bundleManager: BundleManager,
	replicator: Replicator,
) {
	const repsByNamespace = new Map<
		string,
		Map<
			string,
			ServerReplicant<
				NodeCG.AssetFile[],
				NodeCG.Replicant.OptionsWithDefault<NodeCG.AssetFile[]>
			>
		>
	>();

	const getCollectRep = (namespace: string, category: string) => {
		return repsByNamespace.get(namespace)?.get(category);
	};

	const bundles = bundleManager.all();
	const assetsPath = getAssetsPath();
	if (!fs.existsSync(assetsPath)) {
		fs.mkdirSync(assetsPath);
	}

	const collectionsRep = replicator.declare<Collection[]>(
		"collections",
		"_assets",
		{
			defaultValue: [],
			persistent: false,
		},
	);

	const collections: Collection[] = [];

	for (const bundle of bundles) {
		if (
			!bundle.hasAssignableSoundCues &&
			(!bundle.assetCategories || bundle.assetCategories.length <= 0)
		) {
			continue;
		}

		// If this bundle has sounds && at least one of those sounds is assignable, create the assets:sounds replicant.
		if (bundle.hasAssignableSoundCues) {
			bundle.assetCategories.unshift({
				name: "sounds",
				title: "Sounds",
				allowedTypes: ["mp3", "ogg"],
			});
		}

		collections.push({
			name: bundle.name,
			categories: bundle.assetCategories,
		});
	}

	const watchDirs: { path: string; types: string[] }[] = [];

	for (const collection of collections) {
		const namespacedAssetsPath = prepareNamespaceAssetsPath(collection.name);
		const collectionReps = new Map<
			string,
			ServerReplicant<
				NodeCG.AssetFile[],
				NodeCG.Replicant.OptionsWithDefault<NodeCG.AssetFile[]>
			>
		>();
		repsByNamespace.set(collection.name, collectionReps);
		collectionsRep.value.push({
			name: collection.name,
			categories: collection.categories,
		});

		for (const category of collection.categories) {
			const categoryPath = path.join(namespacedAssetsPath, category.name);
			if (!fs.existsSync(categoryPath)) {
				fs.mkdirSync(categoryPath);
			}

			collectionReps.set(
				category.name,
				replicator.declare<NodeCG.AssetFile[]>(
					`assets:${category.name}`,
					collection.name,
					{
						defaultValue: [],
						persistent: false,
					},
				),
			);

			if (category.allowedTypes && category.allowedTypes.length > 0) {
				watchDirs.push({
					path: categoryPath,
					types: category.allowedTypes ?? [],
				});
			} else {
				watchDirs.push({
					path: categoryPath,
					types: [],
				});
			}
		}
	}

	// Chokidar does not accept Windows-style path separators when using globs
	const fixedPaths = Array.fromIterable(watchDirs).map((pattern) => ({
		...pattern,
		path: pattern.path.replace(/\\/g, "/"),
	}));
	const watcher = yield* getWatcher(
		fixedPaths.map((path) => path.path),
		{
			ignored: (val, stats) => {
				if (!stats?.isFile()) {
					return false;
				}
				for (const path of fixedPaths) {
					if (val.startsWith(path.path)) {
						const matchesType = path.types.includes(extname(val).slice(1));
						return !matchesType; // If it matches the type, don't ignore it.
					}
				}
				return false;
			},
		},
	);

	// When the Chokidar watcher first starts up, it will fire an 'add' event for each file found.
	// After that, it will emit the 'ready' event.
	// To avoid thrashing the replicant, we want to add all of these first files at once.
	// This is what the ready Boolean, deferredFiles Map, and resolveDeferreds function are for.

	const addStream = yield* listenToAdd(watcher);
	const changeStream = yield* listenToChange(watcher);
	const unlinkStream = yield* listenToUnlink(watcher);
	const errorStream = yield* listenToError(watcher);

	yield* Effect.forkScoped(
		Effect.gen(function* () {
			yield* waitForReady(watcher);
			yield* addStream.pipe(
				Stream.map(({ path: filepath }) =>
					Effect.tryPromise({
						try: async () => {
							const sum = await hasha.fromFile(filepath, {
								algorithm: "sha1",
							});
							const uploadedFile = createAssetFile(filepath, sum);
							const rep = getCollectRep(
								uploadedFile.namespace,
								uploadedFile.category,
							);
							if (rep) {
								rep.value.push(uploadedFile);
							}
						},
						catch: (err) => {
							logger.error(stringifyError(err));
						},
					}),
				),
				Stream.runForEachChunk((chunk) =>
					Effect.all(chunk, { concurrency: "unbounded" }),
				),
			);
		}),
	);

	yield* Effect.forkScoped(
		changeStream.pipe(
			Stream.groupByKey((event) => event.path),
			GroupBy.evaluate((_path, stream) =>
				stream.pipe(
					Stream.debounce("500 millis"),
					Stream.runForEach((event) =>
						Effect.tryPromise({
							try: async () => {
								const sum = await hasha.fromFile(event.path, {
									algorithm: "sha1",
								});
								const newUploadedFile = createAssetFile(event.path, sum);
								const rep = getCollectRep(
									newUploadedFile.namespace,
									newUploadedFile.category,
								);
								if (!rep) {
									throw new Error("should have had a replicant here");
								}

								const index = rep.value.findIndex(
									(uf) => uf.url === newUploadedFile.url,
								);
								if (index > -1) {
									rep.value.splice(index, 1, newUploadedFile);
								} else {
									rep.value.push(newUploadedFile);
								}
							},
							catch: (err) => {
								logger.error(stringifyError(err));
							},
						}),
					),
				),
			),
			Stream.runDrain,
		),
	);

	// Setup unlink event listener
	yield* Effect.forkScoped(
		Stream.runForEach(unlinkStream, (event) =>
			Effect.sync(() => {
				const deletedFile = createAssetFile(event.path, "temp");
				const rep = getCollectRep(deletedFile.namespace, deletedFile.category);
				if (!rep) {
					return;
				}

				rep.value.some((assetFile, index) => {
					if (assetFile.url === deletedFile.url) {
						rep.value.splice(index, 1);
						logger.debug('"%s" was deleted', deletedFile.url);
						return true;
					}

					return false;
				});
			}),
		),
	);

	// Setup error event listener
	yield* Effect.forkScoped(
		Stream.runForEach(errorStream, (event) =>
			Effect.sync(() => {
				logger.error((event.error as Error).stack);
			}),
		),
	);

	const assetsRouter = express.Router();

	const upload = multer({
		storage: multer.diskStorage({
			destination: getAssetsPath(),
			filename: (req, file, cb) => {
				const params = req.params;
				cb(
					null,
					`${params.namespace}/${params.category}/${Buffer.from(file.originalname, "latin1").toString("utf8")}`,
				);
			},
		}),
	});
	const uploader = upload.array("file", 64);

	// Retrieving existing files
	const getParamsSchema = z.object({
		namespace: z.string(),
		category: z.string(),
		filePath: z.string(),
	});
	assetsRouter.get(
		"/:namespace/:category/:filePath",

		// Check if the user is authorized.
		authCheck,

		// Send the file (or an appropriate error).
		(req, res, next) => {
			const params = getParamsSchema.parse(req.params);
			const parentDir = getAssetsPath();
			const fullPath = path.join(
				parentDir,
				params.namespace,
				params.category,
				params.filePath,
			);
			sendFile(parentDir, fullPath, res, next);
		},
	);

	// Upload new files
	assetsRouter.post(
		"/:namespace/:category",

		// Check if the user is authorized.
		authCheck,

		// Then receive the files they are sending, up to a max of 64.
		(req, res, next) => {
			uploader(req, res, (err) => {
				if (err) {
					console.error(err);
					res.send(500);
					return;
				}

				next();
			});
		},

		// Then send a response.
		(req, res) => {
			if (req.files) {
				res.status(200).send("Success");
			} else {
				res.status(400).send("Bad Request");
			}
		},
	);

	// Deleting existing files
	const deleteParamsSchema = z.object({
		namespace: z.string(),
		category: z.string(),
		filename: z.string(),
	});
	assetsRouter.delete(
		"/:namespace/:category/:filename",

		// Check if the user is authorized.
		authCheck,

		// Delete the file (or an send appropriate error).
		(req, res) => {
			const params = deleteParamsSchema.parse(req.params);
			const fullPath = path.join(
				getAssetsPath(),
				params.namespace,
				params.category,
				params.filename,
			);

			fs.unlink(fullPath, (err) => {
				if (err) {
					if (err.code === "ENOENT") {
						return res
							.status(410)
							.send(`The file to delete does not exist: ${params.filename}`);
					}

					logger.error(`Failed to delete file ${fullPath}`, err);
					return res
						.status(500)
						.send(`Failed to delete file: ${params.filename}`);
				}

				return res.sendStatus(200);
			});
		},
	);

	return assetsRouter;
});
