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
const log = require('../logger')('nodecg/lib/uploads');
const UploadedFile = require('./UploadedFile');
const debounceName = require('../util').debounceName;
const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads/');
const replicantsByBundle = {};
const watchPatterns = [];

// Create UPLOADS_ROOT folder if it does not exist.
/* istanbul ignore next: Simple directory creation. */
if (!fs.existsSync(UPLOADS_ROOT)) {
	fs.mkdirSync(UPLOADS_ROOT);
}

bundles.all().forEach(bundle => {
	if (!bundle.uploadCategories || bundle.uploadCategories.length <= 0) {
		return;
	}

	/* istanbul ignore next: Simple directory creation. */
	const bundleUploadsPath = path.join(UPLOADS_ROOT, bundle.name);
	if (!fs.existsSync(bundleUploadsPath)) {
		fs.mkdirSync(bundleUploadsPath);
	}

	replicantsByBundle[bundle.name] = {};

	bundle.uploadCategories.forEach(category => {
		/* istanbul ignore next: Simple directory creation. */
		const categoryPath = path.join(bundleUploadsPath, category.name);
		if (!fs.existsSync(categoryPath)) {
			fs.mkdirSync(categoryPath);
		}

		replicantsByBundle[bundle.name][category.name] = new Replicant(`uploads:${category.name}`, bundle.name, {
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

	// If this bundle has sounds && at least one of those sounds is assignable, create the uploads:sounds replicant.
	if (bundle.soundCues && bundle.soundCues.length > 0) {
		const soundsPath = path.join(bundleUploadsPath, 'sounds');
		if (!fs.existsSync(soundsPath)) {
			fs.mkdirSync(soundsPath);
		}

		bundle.soundCues.some(sound => {
			if (sound.assignable) {
				replicantsByBundle[bundle.name].sounds = new Replicant('uploads:sounds', bundle.name, {
					defaultValue: [],
					persistent: false
				});
				watchPatterns.push(`${bundleUploadsPath}/sounds/**/*.mp3`);
				watchPatterns.push(`${bundleUploadsPath}/sounds/**/*.ogg`);
				return true;
			}

			return false;
		});
	}
});

const watcher = chokidar.watch(watchPatterns, {ignored: /[\/\\]\./});

watcher.on('add', filepath => {
	sha1File(filepath, (err, sum) => {
		if (err) {
			log.error(err);
			return;
		}

		const uf = new UploadedFile(filepath, sum);
		replicantsByBundle[uf.bundleName][uf.category].value.push(uf);
	});
});

watcher.on('change', filepath => {
	debounceName(filepath, () => {
		sha1File(filepath, (err, sum) => {
			if (err) {
				log.error(err);
				return;
			}

			const newUf = new UploadedFile(filepath, sum);
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
	const df = new UploadedFile(filepath);
	const rep = replicantsByBundle[df.bundleName][df.category];
	rep.value.some((uploadedFile, index) => {
		if (uploadedFile.url === df.url) {
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
		destination: UPLOADS_ROOT,
		filename(req, file, cb) {
			cb(null, `${req.params.bundleName}/${req.params.category}/${req.params.filePath}`);
		}
	})
});

// Retrieving existing files
app.get('/uploads/:bundleName/:category/:filePath', (req, res) => {
	const fullPath = path.join(UPLOADS_ROOT, req.params.bundleName, req.params.category, req.params.filePath);
	fs.exists(fullPath, exists => {
		if (!exists) {
			res.status(404).send(`File not found: ${req.path}`);
			return;
		}

		res.sendFile(fullPath);
	});
});

// Uploading new files
app.post('/uploads/:bundleName/:category/:filePath',

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
app.delete('/uploads/:bundleName/:category/:filename', authCheck, (req, res) => {
	const bundleName = req.params.bundleName;
	const category = req.params.category;
	const filename = req.params.filename;
	const fullpath = path.join(UPLOADS_ROOT, bundleName, category, filename);

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
