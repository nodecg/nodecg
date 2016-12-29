'use strict';

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const sha1File = require('sha1-file');
const app = require('express')();
const multer = require('multer');
const authCheck = require('../util').authCheck;
const bundles = require('../bundles');
const Replicant = require('../replicant');
const log = require('../logger')('nodecg/lib/assets');
const AssetFile = require('./AssetFile');
const debounceName = require('../util').debounceName;
const ASSETS_ROOT = path.resolve(__dirname, '../../assets/');
const replicantsByBundle = {};
const watchPatterns = [];

// Create ASSETS_ROOT folder if it does not exist.
/* istanbul ignore next: Simple directory creation. */
if (!fs.existsSync(ASSETS_ROOT)) {
	fs.mkdirSync(ASSETS_ROOT);
}

bundles.all().forEach(bundle => {
	if (!bundle.hasAssignableSoundCues && (!bundle.assetCategories || bundle.assetCategories.length <= 0)) {
		return;
	}

	/* istanbul ignore next: Simple directory creation. */
	const bundleAssetsPath = path.join(ASSETS_ROOT, bundle.name);
	if (!fs.existsSync(bundleAssetsPath)) {
		fs.mkdirSync(bundleAssetsPath);
	}

	replicantsByBundle[bundle.name] = {};

	bundle.assetCategories.forEach(category => {
		/* istanbul ignore next: Simple directory creation. */
		const categoryPath = path.join(bundleAssetsPath, category.name);
		if (!fs.existsSync(categoryPath)) {
			fs.mkdirSync(categoryPath);
		}

		replicantsByBundle[bundle.name][category.name] = new Replicant(`assets:${category.name}`, bundle.name, {
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

	// If this bundle has sounds && at least one of those sounds is assignable, create the assets:sounds replicant.
	if (bundle.hasAssignableSoundCues) {
		const soundsPath = path.join(bundleAssetsPath, 'sounds');
		if (!fs.existsSync(soundsPath)) {
			fs.mkdirSync(soundsPath);
		}

		bundle.soundCues.some(sound => {
			if (sound.assignable) {
				replicantsByBundle[bundle.name].sounds = new Replicant('assets:sounds', bundle.name, {
					defaultValue: [],
					persistent: false
				});
				watchPatterns.push(`${bundleAssetsPath}/sounds/**/*.mp3`);
				watchPatterns.push(`${bundleAssetsPath}/sounds/**/*.ogg`);
				return true;
			}

			return false;
		});
	}
});

const watcher = chokidar.watch(watchPatterns, {ignored: /[/\\]\./});
let _ready = false;
let _deferredFiles = new Map();

/* When the Chokidar watcher first starts up, it will fire an 'add' event for each file found.
 * After that, it will emit the 'ready' event.
 * To avoid thrashing the replicant, we want to add all of these first files at once.
 * This is what the _ready Boolean, _deferredFiles Map, and resolveDeferreds function are for.
 */

function resolveDeferreds() {
	let foundNull = false;
	_deferredFiles.forEach(uf => {
		if (uf === null) {
			foundNull = true;
		}
	});

	if (!foundNull) {
		_deferredFiles.forEach(uf => {
			replicantsByBundle[uf.bundleName][uf.category].value.push(uf);
		});
		_deferredFiles = null;
	}
}

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

		const uf = new AssetFile(filepath, sum);
		if (_deferredFiles) {
			_deferredFiles.set(filepath, uf);
			resolveDeferreds();
		} else {
			replicantsByBundle[uf.bundleName][uf.category].value.push(uf);
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

			const newUf = new AssetFile(filepath, sum);
			const rep = replicantsByBundle[newUf.bundleName][newUf.category];
			const index = rep.value.findIndex(uf => uf.url === newUf.url);

			if (index > -1) {
				rep.value.splice(index, 1, newUf);
			} else {
				rep.value.push(newUf);
			}
		});
	});
});

watcher.on('unlink', filepath => {
	const df = new AssetFile(filepath);
	const rep = replicantsByBundle[df.bundleName][df.category];
	rep.value.some((assetFile, index) => {
		if (assetFile.url === df.url) {
			rep.value.splice(index, 1);
			log.debug('"%s" was deleted', df.url);
			return true;
		}

		return false;
	});
});

watcher.on('error', e => log.error(e.stack));

const upload = multer({
	storage: multer.diskStorage({
		destination: ASSETS_ROOT,
		filename(req, file, cb) {
			cb(null, `${req.params.bundleName}/${req.params.category}/${req.params.filePath}`);
		}
	})
});

// Retrieving existing files
app.get('/assets/:bundleName/:category/:filePath', (req, res) => {
	const fullPath = path.join(ASSETS_ROOT, req.params.bundleName, req.params.category, req.params.filePath);
	fs.exists(fullPath, exists => {
		if (!exists) {
			res.status(404).send(`File not found: ${req.path}`);
			return;
		}

		res.sendFile(fullPath);
	});
});

// Uploading new files
app.post('/assets/:bundleName/:category/:filePath',

	// Check if the user is authorized
	authCheck,

	// Then receive the files they are sending, up to a max of 64
	upload.array('file', 64),

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
app.delete('/assets/:bundleName/:category/:filename', authCheck, (req, res) => {
	const bundleName = req.params.bundleName;
	const category = req.params.category;
	const filename = req.params.filename;
	const fullpath = path.join(ASSETS_ROOT, bundleName, category, filename);

	fs.exists(fullpath, exists => {
		if (!exists) {
			res.status(410).send(`The file to delete does not exist: ${filename}`);
			return;
		}

		fs.unlink(fullpath, err => {
			if (err) {
				log.error(`Failed to delete file: ${err.message}`);
				res.status(500).send(`Failed to delete file: ${filename}`);
				return;
			}

			res.sendStatus(200);
		});
	});
});

module.exports = app;
