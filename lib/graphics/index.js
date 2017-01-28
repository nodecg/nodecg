'use strict';

const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const log = require('../logger')('nodecg/lib/graphics');
const Bundles = require('../bundles');
const ncgUtils = require('../util');

log.trace('Adding Express routes');
app.set('views', path.resolve(__dirname, '..'));

// Start up the singleInstance enforcement lib
app.use(require('./single_instance'));

app.get('/graphics/:bundleName*', ncgUtils.authCheck, (req, res, next) => {
	const bundleName = req.params.bundleName;
	const bundle = Bundles.find(bundleName);
	if (!bundle) {
		next();
		return;
	}

	// We start out assuming the user is trying to reach the index page
	let resName = 'index.html';

	// We need a trailing slash for view index pages so that relatively linked assets can be reached as expected.
	if (req.path.endsWith(bundleName)) {
		res.redirect(req.url.replace(bundleName, `${bundleName}/`));
		return;
	}

	// If the url path is just ":bundleName/", then the user is trying to resolve an asset and not the index page.
	if (!req.path.endsWith(`${bundleName}/`)) {
		resName = req.params[0].substr(1);
	}

	const fileLocation = path.join(bundle.dir, 'graphics', resName);

	// Check if the file exists
	if (!fs.existsSync(fileLocation)) {
		next();
		return;
	}

	// Set a flag if this graphic is one we should enforce singleInstance behavior on.
	// This flag is passed to injectScripts, which then injects the client-side portion of the
	// singleInstance enforcement.
	let singleInstance = false;
	let isGraphic = false;
	bundle.graphics.some(graphic => {
		if (graphic.file === resName) {
			isGraphic = true;
			singleInstance = graphic.singleInstance;
			return true;
		}

		return false;
	});

	// If this file is a main HTML file for a graphic, inject the graphic setup scripts.
	if (isGraphic) {
		ncgUtils.injectScripts(fileLocation, 'graphic', {
			createApiInstance: bundle,
			singleInstance,
			sound: bundle.soundCues && bundle.soundCues.length > 0
		}, html => res.send(html));
	} else {
		res.sendFile(fileLocation);
	}
});

app.get('/graphics/:bundle/components/*', (req, res, next) => {
	const bundleName = req.params.bundle;
	const bundle = Bundles.find(bundleName);
	if (!bundle) {
		next();
		return;
	}

	const resName = req.params[0];
	const fileLocation = path.join(bundle.dir, 'bower_components', resName);

	// Check if the file exists
	if (!fs.existsSync(fileLocation)) {
		next();
		return;
	}

	res.sendFile(fileLocation);
});

module.exports = app;
