// Native
const path = require('path');

// Packages
const express = require('express');

// Ours
const log = require('./logger')('nodecg/lib/dashboard');
const bundles = require('./bundle-manager');
const ncgUtils = require('./util');

const app = express();

log.trace('Adding Express routes');

app.get('/bundles/:bundleName/shared/*', ncgUtils.authCheck, (req, res, next) => {
	const bundleName = req.params.bundleName;
	const bundle = bundles.find(bundleName);
	if (!bundle) {
		next();
		return;
	}

	// Essentially behave like express.static
	// Serve up files with no extra logic

	const resName = req.params[0];
	const fileLocation = path.join(bundle.dir, 'shared', resName);
	res.sendFile(fileLocation, err => {
		if (err) {
			if (err.code === 'ENOENT') {
				return res.sendStatus(404);
			}

			return next();
		}
	});
});

module.exports = app;
