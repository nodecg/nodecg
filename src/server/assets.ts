import * as fs from 'fs';
import * as path from 'path';

import express from 'express';
import chokidar from 'chokidar';
import multer from 'multer';
import hasha from 'hasha';
import { z } from 'zod';

import { authCheck, debounceName, sendFile } from './util';
import createLogger from './logger';
import type Replicator from './replicant/replicator';
import type ServerReplicant from './replicant/server-replicant';
import type { NodeCG } from '../types/nodecg';
import { stringifyError } from '../shared/utils';
import { NODECG_ROOT } from './nodecg-root';

type Collection = {
	name: string;
	categories: NodeCG.Bundle.AssetCategory[];
};

const logger = createLogger('assets');

const ASSETS_ROOT = path.join(NODECG_ROOT, 'assets');

const createAssetFile = (filepath: string, sum: string): NodeCG.AssetFile => {
	const parsedPath = path.parse(filepath);
	const parts = parsedPath.dir.replace(ASSETS_ROOT + path.sep, '').split(path.sep);

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
	const assetsPath = path.join(ASSETS_ROOT, namespace);

	if (!fs.existsSync(assetsPath)) {
		fs.mkdirSync(assetsPath);
	}

	return assetsPath;
};

const repsByNamespace = new Map<
	string,
	Map<string, ServerReplicant<NodeCG.AssetFile[], NodeCG.Replicant.OptionsWithDefault<NodeCG.AssetFile[]>>>
>();

const getCollectRep = (namespace: string, category: string) => {
	return repsByNamespace.get(namespace)?.get(category);
};

const resolveDeferreds = (deferredFiles: Map<string, NodeCG.AssetFile | undefined>) => {
	let foundNull = false;
	deferredFiles.forEach((uf) => {
		if (uf === null) {
			foundNull = true;
		}
	});

	if (!foundNull) {
		deferredFiles.forEach((uploadedFile) => {
			if (!uploadedFile) {
				return;
			}

			const rep = getCollectRep(uploadedFile.namespace, uploadedFile.category);
			if (rep) {
				rep.value.push(uploadedFile);
			}
		});
		deferredFiles.clear();
	}
};

export const createAssetsMiddleware = (bundles: NodeCG.Bundle[], replicator: Replicator) => {
	if (!fs.existsSync(ASSETS_ROOT)) {
		fs.mkdirSync(ASSETS_ROOT);
	}

	const collectionsRep = replicator.declare<Collection[]>('collections', '_assets', {
		defaultValue: [],
		persistent: false,
	});

	const collections: Collection[] = [];

	for (const bundle of bundles) {
		if (!bundle.hasAssignableSoundCues && (!bundle.assetCategories || bundle.assetCategories.length <= 0)) {
			continue;
		}

		// If this bundle has sounds && at least one of those sounds is assignable, create the assets:sounds replicant.
		if (bundle.hasAssignableSoundCues) {
			bundle.assetCategories.unshift({
				name: 'sounds',
				title: 'Sounds',
				allowedTypes: ['mp3', 'ogg'],
			});
		}

		collections.push({
			name: bundle.name,
			categories: bundle.assetCategories,
		});
	}

	const watchPatterns = new Set<string>();

	for (const collection of collections) {
		const namespacedAssetsPath = prepareNamespaceAssetsPath(collection.name);
		const collectionReps = new Map<
			string,
			ServerReplicant<NodeCG.AssetFile[], NodeCG.Replicant.OptionsWithDefault<NodeCG.AssetFile[]>>
		>();
		repsByNamespace.set(collection.name, collectionReps);
		collectionsRep.value.push({ name: collection.name, categories: collection.categories });

		for (const category of collection.categories) {
			const categoryPath = path.join(namespacedAssetsPath, category.name);
			if (!fs.existsSync(categoryPath)) {
				fs.mkdirSync(categoryPath);
			}

			collectionReps.set(
				category.name,
				replicator.declare<NodeCG.AssetFile[]>(`assets:${category.name}`, collection.name, {
					defaultValue: [],
					persistent: false,
				}),
			);

			if (category.allowedTypes && category.allowedTypes.length > 0) {
				category.allowedTypes.forEach((type) => {
					watchPatterns.add(`${categoryPath}/**/*.${type}`);
				});
			} else {
				watchPatterns.add(`${categoryPath}/**/*`);
			}
		}
	}

	// Chokidar does not accept Windows-style path separators when using globs
	const fixedPaths = Array.from(watchPatterns).map((pattern) => pattern.replace(/\\/g, '/'));
	const watcher = chokidar.watch(fixedPaths, { ignored: '**/.*' });

	/**
	 * When the Chokidar watcher first starts up, it will fire an 'add' event for each file found.
	 * After that, it will emit the 'ready' event.
	 * To avoid thrashing the replicant, we want to add all of these first files at once.
	 * This is what the ready Boolean, deferredFiles Map, and resolveDeferreds function are for.
	 */
	let ready = false;
	const deferredFiles = new Map<string, NodeCG.AssetFile | undefined>();
	watcher.on('add', async (filepath) => {
		if (!ready) {
			deferredFiles.set(filepath, undefined);
		}

		try {
			const sum = await hasha.fromFile(filepath, { algorithm: 'sha1' });
			const uploadedFile = createAssetFile(filepath, sum);
			if (deferredFiles) {
				deferredFiles.set(filepath, uploadedFile);
				resolveDeferreds(deferredFiles);
			} else {
				const rep = getCollectRep(uploadedFile.namespace, uploadedFile.category);
				if (rep) {
					rep.value.push(uploadedFile);
				}
			}
		} catch (err: unknown) {
			if (deferredFiles) {
				deferredFiles.delete(filepath);
			}

			logger.error(stringifyError(err));
		}
	});

	watcher.on('ready', () => {
		ready = true;
	});

	watcher.on('change', (filepath) => {
		debounceName(filepath, async () => {
			try {
				const sum = await hasha.fromFile(filepath, { algorithm: 'sha1' });
				const newUploadedFile = createAssetFile(filepath, sum);
				const rep = getCollectRep(newUploadedFile.namespace, newUploadedFile.category);
				if (!rep) {
					throw new Error('should have had a replicant here');
				}

				const index = rep.value.findIndex((uf) => uf.url === newUploadedFile.url);
				if (index > -1) {
					rep.value.splice(index, 1, newUploadedFile);
				} else {
					rep.value.push(newUploadedFile);
				}
			} catch (err: unknown) {
				logger.error(stringifyError(err));
			}
		});
	});

	watcher.on('unlink', (filepath) => {
		const deletedFile = createAssetFile(filepath, 'temp');
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
	});

	watcher.on('error', (e) => {
		logger.error(e.stack);
	});

	const assetsRouter = express.Router();

	const upload = multer({
		storage: multer.diskStorage({
			destination: ASSETS_ROOT,
			filename: (req, file, cb) => {
				const params = req.params;
				cb(
					null,
					`${params['namespace']}/${params['category']}/${Buffer.from(file.originalname, 'latin1').toString('utf8')}`,
				);
			},
		}),
	});
	const uploader = upload.array('file', 64);

	// Retrieving existing files
	const getParamsSchema = z.object({
		namespace: z.string(),
		category: z.string(),
		filePath: z.string(),
	});
	assetsRouter.get(
		'/:namespace/:category/:filePath',

		// Check if the user is authorized.
		authCheck,

		// Send the file (or an appropriate error).
		(req, res, next) => {
			const params = getParamsSchema.parse(req.params);
			const parentDir = ASSETS_ROOT;
			const fullPath = path.join(parentDir, params.namespace, params.category, params.filePath);
			sendFile(parentDir, fullPath, res, next);
		},
	);

	// Upload new files
	assetsRouter.post(
		'/:namespace/:category',

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
				res.status(200).send('Success');
			} else {
				res.status(400).send('Bad Request');
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
		'/:namespace/:category/:filename',

		// Check if the user is authorized.
		authCheck,

		// Delete the file (or an send appropriate error).
		(req, res) => {
			const params = deleteParamsSchema.parse(req.params);
			const fullPath = path.join(ASSETS_ROOT, params.namespace, params.category, params.filename);

			fs.unlink(fullPath, (err) => {
				if (err) {
					if (err.code === 'ENOENT') {
						return res.status(410).send(`The file to delete does not exist: ${params.filename}`);
					}

					logger.error(`Failed to delete file ${fullPath}`, err);
					return res.status(500).send(`Failed to delete file: ${params.filename}`);
				}

				return res.sendStatus(200);
			});
		},
	);

	return assetsRouter;
};
