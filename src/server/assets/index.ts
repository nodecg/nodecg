// Native
import * as fs from 'fs';
import * as path from 'path';

// Packages
import express from 'express';
import chokidar from 'chokidar';
import multer from 'multer';
import sha1File from 'sha1-file';

// Ours
import AssetFile from './AssetFile';
import { authCheck, debounceName, sendFile } from '../util';
import createLogger from '../logger';
import type Replicator from '../replicant/replicator';
import type ServerReplicant from '../replicant/server-replicant';
import type { NodeCG } from '../../types/nodecg';
import { stringifyError } from '../../shared/utils';

type Collection = {
	name: string;
	categories: NodeCG.Bundle.AssetCategory[];
};

export default class AssetManager {
	readonly log = createLogger('assets');

	readonly assetsRoot = path.join(process.env.NODECG_ROOT, 'assets');

	readonly collectionsRep: ServerReplicant<Collection[]>;

	readonly app: ReturnType<typeof express>;

	private readonly _repsByNamespace = new Map<string, Map<string, ServerReplicant<AssetFile[]>>>();

	private readonly _replicator: Replicator;

	constructor(bundles: NodeCG.Bundle[], replicator: Replicator) {
		this._replicator = replicator;

		// Create assetsRoot folder if it does not exist.
		/* istanbul ignore next: Simple directory creation. */
		if (!fs.existsSync(this.assetsRoot)) {
			fs.mkdirSync(this.assetsRoot);
		}

		this.collectionsRep = replicator.declare<Collection[]>('collections', '_assets', {
			defaultValue: [],
			persistent: false,
		});

		const { watchPatterns } = this._computeCollections(bundles);
		this._setupWatcher(watchPatterns);
		this.app = this._setupExpress();
	}

	private _computeCollections(bundles: NodeCG.Bundle[]): { collections: Collection[]; watchPatterns: Set<string> } {
		const watchPatterns = new Set<string>();
		const collections: Collection[] = [];
		bundles.forEach((bundle) => {
			if (!bundle.hasAssignableSoundCues && (!bundle.assetCategories || bundle.assetCategories.length <= 0)) {
				return;
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
		});

		collections.forEach(({ name, categories }) => {
			const namespacedAssetsPath = this._calcNamespacedAssetsPath(name);
			const collectionReps = new Map<string, ServerReplicant<AssetFile[]>>();
			this._repsByNamespace.set(name, collectionReps);
			this.collectionsRep.value.push({ name, categories });

			for (const category of categories) {
				/* istanbul ignore next: Simple directory creation. */
				const categoryPath = path.join(namespacedAssetsPath, category.name);
				if (!fs.existsSync(categoryPath)) {
					fs.mkdirSync(categoryPath);
				}

				collectionReps.set(
					category.name,
					this._replicator.declare<AssetFile[]>(`assets:${category.name}`, name, {
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
		});

		return { collections, watchPatterns };
	}

	private _setupWatcher(watchPatterns: Set<string>): void {
		// Chokidar no longer accepts Windows-style path separators when using globs.
		// Therefore, we must replace them with Unix-style ones.
		// See https://github.com/paulmillr/chokidar/issues/777 for more details.
		const fixedPaths = Array.from(watchPatterns).map((pattern) => pattern.replace(/\\/g, '/'));
		const watcher = chokidar.watch(fixedPaths, { ignored: /[/\\]\./ });

		/* When the Chokidar watcher first starts up, it will fire an 'add' event for each file found.
		 * After that, it will emit the 'ready' event.
		 * To avoid thrashing the replicant, we want to add all of these first files at once.
		 * This is what the ready Boolean, deferredFiles Map, and resolveDeferreds function are for.
		 */
		let ready = false;
		const deferredFiles = new Map<string, AssetFile | undefined>();
		watcher.on('add', async (filepath) => {
			if (!ready) {
				deferredFiles.set(filepath, undefined);
			}

			try {
				const sum = await sha1File(filepath);
				const uploadedFile = new AssetFile(filepath, sum);
				if (deferredFiles) {
					deferredFiles.set(filepath, uploadedFile);
					this._resolveDeferreds(deferredFiles);
				} else {
					const rep = this._getCollectRep(uploadedFile.namespace, uploadedFile.category);
					if (rep) {
						rep.value.push(uploadedFile);
					}
				}
			} catch (err: unknown) {
				if (deferredFiles) {
					deferredFiles.delete(filepath);
				}

				this.log.error(stringifyError(err));
			}
		});

		watcher.on('ready', () => {
			ready = true;
		});

		watcher.on('change', (filepath) => {
			debounceName(filepath, async () => {
				try {
					const sum = await sha1File(filepath);
					const newUploadedFile = new AssetFile(filepath, sum);
					const rep = this._getCollectRep(newUploadedFile.namespace, newUploadedFile.category);
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
					this.log.error(stringifyError(err));
				}
			});
		});

		watcher.on('unlink', (filepath) => {
			const deletedFile = new AssetFile(filepath, 'temp');
			const rep = this._getCollectRep(deletedFile.namespace, deletedFile.category);
			if (!rep) {
				return;
			}

			rep.value.some((assetFile, index) => {
				if (assetFile.url === deletedFile.url) {
					rep.value.splice(index, 1);
					this.log.debug('"%s" was deleted', deletedFile.url);
					return true;
				}

				return false;
			});
		});

		watcher.on('error', (e) => {
			this.log.error(e.stack);
		});
	}

	private _setupExpress(): ReturnType<typeof express> {
		const app = express();
		const upload = multer({
			storage: multer.diskStorage({
				destination: this.assetsRoot,
				filename(req, file, cb) {
					const p = req.params as Record<string, string>;
					cb(null, `${p.namespace}/${p.category}/${file.originalname}`);
				},
			}),
		});
		const uploader = upload.array('file', 64);

		// Retrieving existing files
		app.get(
			'/assets/:namespace/:category/:filePath',

			// Check if the user is authorized.
			authCheck,

			// Send the file (or an appropriate error).
			(req, res, next) => {
				const fullPath = path.join(
					this.assetsRoot,
					req.params.namespace,
					req.params.category,
					req.params.filePath,
				);
				sendFile(fullPath, res, next);
			},
		);

		// Uploading new files
		app.post(
			'/assets/:namespace/:category',

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
		app.delete(
			'/assets/:namespace/:category/:filename',

			// Check if the user is authorized.
			authCheck,

			// Delete the file (or an send appropriate error).
			(req, res) => {
				const { namespace, category, filename } = req.params as Record<string, string>;
				const fullPath = path.join(this.assetsRoot, namespace, category, filename);

				fs.unlink(fullPath, (err) => {
					if (err) {
						if (err.code === 'ENOENT') {
							return res.status(410).send(`The file to delete does not exist: ${filename}`);
						}

						this.log.error(`Failed to delete file ${fullPath}`, err);
						return res.status(500).send(`Failed to delete file: ${filename}`);
					}

					return res.sendStatus(200);
				});
			},
		);

		return app;
	}

	private _calcNamespacedAssetsPath(namespace: string): string {
		const assetsPath = path.join(this.assetsRoot, namespace);
		/* istanbul ignore next: Simple directory creation. */
		if (!fs.existsSync(assetsPath)) {
			fs.mkdirSync(assetsPath);
		}

		return assetsPath;
	}

	private _resolveDeferreds(deferredFiles: Map<string, AssetFile | undefined>): void {
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

				const rep = this._getCollectRep(uploadedFile.namespace, uploadedFile.category);
				if (rep) {
					rep.value.push(uploadedFile);
				}
			});
			deferredFiles.clear();
		}
	}

	private _getCollectRep(namespace: string, category: string): ServerReplicant<AssetFile[]> | undefined {
		const nspReps = this._repsByNamespace.get(namespace);
		if (nspReps) {
			return nspReps.get(category);
		}

		return undefined;
	}
}
