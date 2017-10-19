'use strict';

// Native
const fs = require('fs');
const path = require('path');

// Packages
const app = require('express')();
const chokidar = require('chokidar');
const multer = require('multer');
const sha1File = require('sha1-file');

// Ours
const AssetFile = require('./AssetFile');
const authCheck = require('../util').authCheck;
const bundles = require('../bundle-manager');
const debounceName = require('../util').debounceName;
const log = require('../logger')('nodecg/lib/assets');
const Replicant = require('../replicant');

const ASSETS_ROOT = path.join(process.env.NODECG_ROOT, 'assets');
const collectionsRep = new Replicant('collections', '_assets', {defaultValue: [], persistent: false});
const replicantsByNamespace = {};
const watchPatterns = [];
const upload = multer({
	storage: multer.diskStorage({
		destination: ASSETS_ROOT,
		filename(req, file, cb) {
			cb(null, `${req.params.namespace}/${req.params.category}/${req.params.filePath}`);
		}
	})
});
let _ready = false;
let _deferredFiles = new Map();

const collections = [];

// Create ASSETS_ROOT folder if it does not exist.
/* istanbul ignore next: Simple directory creation. */
if (!fs.existsSync(ASSETS_ROOT)) {
	fs.mkdirSync(ASSETS_ROOT);
}

bundles.all().forEach(bundle => {
	if (!bundle.hasAssignableSoundCues && (!bundle.assetCategories || bundle.assetCategories.length <= 0)) {
		return;
	}

	// If this bundle has sounds && at least one of those sounds is assignable, create the assets:sounds replicant.
	if (bundle.hasAssignableSoundCues) {
		bundle.assetCategories.unshift({
			name: 'sounds',
			title: 'Sounds',
			allowedTypes: ['mp3', 'ogg']
		});
	}

	collections.push({
		name: bundle.name,
		categories: bundle.assetCategories
	});
});

collections.forEach(({name, categories}) => {
	const namespacedAssetsPath = calcNamespacedAssetsPath(name);
	replicantsByNamespace[name] = {};
	collectionsRep.value.push({name, categories});
	categories.forEach(category => {
		/* istanbul ignore next: Simple directory creation. */
		const categoryPath = path.join(namespacedAssetsPath, category.name);
		if (!fs.existsSync(categoryPath)) {
			fs.mkdirSync(categoryPath);
		}

		replicantsByNamespace[name][category.name] = new Replicant(`assets:${category.name}`, name, {
			defaultValue: [],
			persistent: false
		});

		if (category.allowedTypes && category.allowedTypes.length > 0) {
			category.allowedTypes.forEach(type => {
				watchPatterns.push(`${categoryPath}/**/*.${type}`);
			});
		} else {
			watchPatterns.push(`${categoryPath}/**/*`);
		}
	});
});

const watcher = chokidar.watch(watchPatterns, {ignored: /[/\\]\./});

/* When the Chokidar watcher first starts up, it will fire an 'add' event for each file found.
 * After that, it will emit the 'ready' event.
 * To avoid thrashing the replicant, we want to add all of these first files at once.
 * This is what the _ready Boolean, _deferredFiles Map, and resolveDeferreds function are for.
 */

watcher.on('add', filepath => {
	if (!_ready) {
		_deferredFiles.set(filepath, null);
	}

	sha1File(filepath, (err, sum) => {
		if (err) {
			if (_deferredFiles) {
				_deferredFiles.remove(filepath);
			}

			log.error(err);
			return;
		}

		const uploadedFile = new AssetFile(filepath, sum);
		if (_deferredFiles) {
			_deferredFiles.set(filepath, uploadedFile);
			resolveDeferreds();
		} else {
			replicantsByNamespace[uploadedFile.namespace][uploadedFile.category].value.push(uploadedFile);
		}
	});
});

watcher.on('ready', () => {
	_ready = true;
});

watcher.on('change', filepath => {
	debounceName(filepath, () => {
		sha1File(filepath, (err, sum) => {
			if (err) {
				log.error(err);
				return;
			}

			const newUploadedFile = new AssetFile(filepath, sum);
			const rep = replicantsByNamespace[newUploadedFile.namespace][newUploadedFile.category];
			const index = rep.value.findIndex(uf => uf.url === newUploadedFile.url);

			if (index > -1) {
				rep.value.splice(index, 1, newUploadedFile);
			} else {
				rep.value.push(newUploadedFile);
			}
		});
	});
});

watcher.on('unlink', filepath => {
	const deletedFile = new AssetFile(filepath);
	const rep = replicantsByNamespace[deletedFile.namespace][deletedFile.category];
	rep.value.some((assetFile, index) => {
		if (assetFile.url === deletedFile.url) {
			rep.value.splice(index, 1);
			log.debug('"%s" was deleted', deletedFile.url);
			return true;
		}

		return false;
	});
});

watcher.on('error', e => log.error(e.stack));

// Retrieving existing files
app.get(
	'/assets/:namespace/:category/:filePath',

	// Check if the user is authorized.
	authCheck,

	// Send the file (or an appropriate error).
	(req, res) => {
		const fullPath = path.join(ASSETS_ROOT, req.params.namespace, req.params.category, req.params.filePath);
		res.sendFile(fullPath, err => {
			if (err) {
				if (err.code === 'ENOENT') {
					return res.sendStatus(404);
				}
				log.error(`Unexpected error sending file ${fullPath}`, err);
				res.sendStatus(500);
			}
		});
	}
);

const uploader = upload.array('file', 64);

// Uploading new files
app.post(
	'/assets/:namespace/:category/:filePath',

	// Check if the user is authorized.
	authCheck,

	// Then receive the files they are sending, up to a max of 64.
	(req, res, next) => {
		uploader(req, res, err => {
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
	}
);

// Deleting existing files
app.delete(
	'/assets/:namespace/:category/:filename',

	// Check if the user is authorized.
	authCheck,

	// Delete the file (or an send appropriate error).
	(req, res) => {
		const namespace = req.params.namespace;
		const category = req.params.category;
		const filename = req.params.filename;
		const fullPath = path.join(ASSETS_ROOT, namespace, category, filename);

		fs.unlink(fullPath, err => {
			if (err) {
				if (err.code === 'ENOENT') {
					return res.status(410).send(`The file to delete does not exist: ${filename}`);
				}

				log.error(`Failed to delete file ${fullPath}`, err);
				return res.status(500).send(`Failed to delete file: ${filename}`);
			}

			res.sendStatus(200);
		});
	}
);

module.exports = app;

function calcNamespacedAssetsPath(namespace) {
	const assetsPath = path.join(ASSETS_ROOT, namespace);
	/* istanbul ignore next: Simple directory creation. */
	if (!fs.existsSync(assetsPath)) {
		fs.mkdirSync(assetsPath);
	}
	return assetsPath;
}

function resolveDeferreds() {
	let foundNull = false;
	_deferredFiles.forEach(uf => {
		if (uf === null) {
			foundNull = true;
		}
	});

	if (!foundNull) {
		_deferredFiles.forEach(uploadedFile => {
			replicantsByNamespace[uploadedFile.namespace][uploadedFile.category].value.push(uploadedFile);
		});
		_deferredFiles = null;
	}
}
