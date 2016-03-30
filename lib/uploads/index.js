'use strict';

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const md5File = require('md5-file');
const app = require('express')();
const multer = require('multer');
const authCheck = require('../util').authCheck;
const bundles = require('../bundles');
const Replicant = require('../replicant');
const log = require('../logger')('nodecg/lib/uploads');
const UploadedFile = require('./UploadedFile');
const debounceName = require('../util').debounceName;
const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads/');
const uploadReplicants = [];

// Create UPLOADS_ROOT folder if it does not exist.
/* istanbul ignore next: Simple directory creation. */
if (!fs.existsSync(UPLOADS_ROOT)) {
	fs.mkdirSync(UPLOADS_ROOT);
}

const watchPatterns = [];

bundles.all().forEach(bundle => {
	if (bundle.uploads && bundle.uploads.enabled) {
		/* istanbul ignore next: Simple directory creation. */
		const bundleUploadsPath = path.join(UPLOADS_ROOT, bundle.name);
		if (!fs.existsSync(bundleUploadsPath)) {
			fs.mkdirSync(bundleUploadsPath);
		}

		uploadReplicants[bundle.name] = new Replicant('uploads', bundle.name, {
			defaultValue: [],
			persistent: false
		});

		if (bundle.uploads.allowedTypes.length > 0) {
			bundle.uploads.allowedTypes.forEach(type => {
				watchPatterns.push(`${bundleUploadsPath}/**/*.${type}`);
			});
		} else {
			watchPatterns.push(`${bundleUploadsPath}/**/*`);
		}
	}
});

const watcher = chokidar.watch(watchPatterns, {
	ignored: /[\/\\]\./
});

watcher.on('add', filepath => {
	md5File(filepath, (err, sum) => {
		if (err) {
			log.error(err);
			return;
		}

		const uploadedFile = new UploadedFile(filepath, sum);
		uploadReplicants[uploadedFile.bundleName].value.push(uploadedFile);
	});
});

watcher.on('change', filepath => {
	debounceName(filepath, () => {
		md5File(filepath, (err, sum) => {
			if (err) {
				log.error(err);
				return;
			}

			const uploadedFile = new UploadedFile(filepath, sum);
			let index = -1;
			uploadReplicants[uploadedFile.bundleName].value.some((uf, i) => {
				if (uf.url === uploadedFile.url) {
					index = i;
					return true;
				}

				return false;
			});

			if (index > -1) {
				uploadReplicants[uploadedFile.bundleName].value.splice(index, 1, uploadedFile);
			} else {
				uploadReplicants[uploadedFile.bundleName].value.push(uploadedFile);
			}
		});
	});
});

watcher.on('unlink', filepath => {
	const deletedFile = new UploadedFile(filepath);
	uploadReplicants[deletedFile.bundleName].value.some((uploadedFile, index) => {
		if (uploadedFile.url === deletedFile.url) {
			uploadReplicants[deletedFile.bundleName].value.splice(index, 1);
			log.debug('"%s" was deleted', deletedFile.url);
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
			cb(null, `${req.params.bundleName}/${req.params.filePath}`);
		}
	})
});

// Retrieving existing files
app.get('/uploads/:bundleName/:filePath', (req, res) => {
	const fullPath = path.join(UPLOADS_ROOT, req.params.bundleName, req.params.filePath);
	fs.exists(fullPath, exists => {
		if (!exists) {
			res.status(404).send(`File not found: ${req.path}`);
			return;
		}

		res.sendFile(fullPath);
	});
});

// Uploading new files
app.post('/uploads/:bundleName/:filePath',

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
app.delete('/uploads/:bundleName/:filename', authCheck, (req, res) => {
	const bundleName = req.params.bundleName;
	const filename = req.params.filename;
	const fullpath = path.join(UPLOADS_ROOT, bundleName, filename);

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
