'use strict';

var fs = require('fs');
var path = require('path');
var chokidar = require('chokidar');
var md5File = require('md5-file');
var app = require('express')();
var multer = require('multer');
var authCheck = require('../util').authCheck;
var bundles = require('../bundles');
var Replicant = require('../replicant');
var log = require('../logger')('nodecg/lib/uploads');
var UploadedFile = require('./UploadedFile');
var debounceName = require('../util').debounceName;
var UPLOADS_ROOT = path.resolve(__dirname, '../../uploads/');
var uploadReplicants = [];

// Create UPLOADS_ROOT folder if it does not exist.
/* istanbul ignore next: Simple directory creation. */
if (!fs.existsSync(UPLOADS_ROOT)) {
	fs.mkdirSync(UPLOADS_ROOT);
}

var watchPatterns = [];

bundles.all().forEach(function (bundle) {
	if (bundle.uploads && bundle.uploads.enabled) {
		/* istanbul ignore next: Simple directory creation. */
		var bundleUploadsPath = path.join(UPLOADS_ROOT, bundle.name);
		if (!fs.existsSync(bundleUploadsPath)) {
			fs.mkdirSync(bundleUploadsPath);
		}

		uploadReplicants[bundle.name] = new Replicant('uploads', bundle.name, {
			defaultValue: [],
			persistent: false
		});

		if (bundle.uploads.allowedTypes.length > 0) {
			bundle.uploads.allowedTypes.forEach(function (type) {
				watchPatterns.push(bundleUploadsPath + '/**/*.' + type);
			});
		} else {
			watchPatterns.push(bundleUploadsPath + '/**/*');
		}
	}
});

var watcher = chokidar.watch(watchPatterns, {
	ignored: /[\/\\]\./
});

watcher.on('add', function fileAdded(filepath) {
	md5File(filepath, function (err, sum) {
		if (err) {
			log.error(err);
			return;
		}

		var uploadedFile = new UploadedFile(filepath, sum);
		uploadReplicants[uploadedFile.bundleName].value.push(uploadedFile);
	});
});

watcher.on('change', function fileChanged(filepath) {
	debounceName(filepath, function () {
		md5File(filepath, function (err, sum) {
			if (err) {
				log.error(err);
				return;
			}

			var uploadedFile = new UploadedFile(filepath, sum);
			var index = -1;
			uploadReplicants[uploadedFile.bundleName].value.some(function (uf, i) {
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

watcher.on('unlink', function fileUnlinked(filepath) {
	var deletedFile = new UploadedFile(filepath);
	uploadReplicants[deletedFile.bundleName].value.some(function (uploadedFile, index) {
		if (uploadedFile.url === deletedFile.url) {
			uploadReplicants[deletedFile.bundleName].value.splice(index, 1);
			log.debug('"%s" was deleted', deletedFile.url);
			return true;
		}

		return false;
	});
});

watcher.on('error', function (e) {
	log.error(e.stack);
});

var upload = multer({
	storage: multer.diskStorage({
		destination: UPLOADS_ROOT,
		filename: function (req, file, cb) {
			cb(null, req.params.bundleName + '/' + req.params.filePath);
		}
	})
});

// Retrieving existing files
app.get('/uploads/:bundleName/:filePath', function (req, res) {
	var fullPath = path.join(UPLOADS_ROOT, req.params.bundleName, req.params.filePath);
	fs.exists(fullPath, function (exists) {
		if (!exists) {
			res.status(404).send('File not found:' + req.path);
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
	function (req, res) {
		if (req.files) {
			res.status(200).send('Success');
		} else {
			res.status(400).send('Bad Request');
		}
	}
);

// Deleting existing files
app.delete('/uploads/:bundleName/:filename', authCheck, function (req, res) {
	var bundleName = req.params.bundleName;
	var filename = req.params.filename;

	var fullpath = path.join(UPLOADS_ROOT, bundleName, filename);
	fs.exists(fullpath, function (exists) {
		if (!exists) {
			res.status(410).send('The file to delete does not exist: ' + filename);
			return;
		}

		fs.unlink(fullpath, function (err) {
			if (err) {
				log.error('Failed to delete file:', err.message);
				res.status(500).send('Failed to delete file: ' + filename);
				return;
			}

			res.sendStatus(200);
		});
	});
});

module.exports = app;
