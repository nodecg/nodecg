'use strict';

var express = require('express');
var app = express();
var fs = require('fs');
var path = require('path');
var log = require('../logger')('nodecg/lib/graphics');
var Bundles = require('../bundles');
var ncgUtils = require('../util');

log.trace('Adding Express routes');
app.set('views', path.resolve(__dirname, '..'));

// Start up the singleInstance enforcement lib
app.use(require('./single_instance'));

// TODO: Secure this with ncgUtils.authCheck once we figure out how to make that not break OBS.
app.get('/graphics/:bundleName*', function (req, res, next) {
	var bundleName = req.params.bundleName;
	var bundle = Bundles.find(bundleName);
	if (!bundle) {
		next();
		return;
	}

	// We start out assuming the user is trying to reach the index page
	var resName = 'index.html';

	// We need a trailing slash for view index pages so that relatively linked assets can be reached as expected.
	if (req.path.endsWith(bundleName)) {
		res.redirect(req.url.replace(bundleName, bundleName + '/'));
		return;
	}

	// If the url path is just ":bundleName/", then the user is trying to resolve an asset and not the index page.
	if (!req.path.endsWith(bundleName + '/')) {
		resName = req.params[0].substr(1);
	}

	var fileLocation = path.join(bundle.dir, 'graphics', resName);

	// Check if the file exists
	if (!fs.existsSync(fileLocation)) {
		next();
		return;
	}

	// Set a flag if this graphic is one we should enforce singleInstance behavior on.
	// This flag is passed to injectScripts, which then injects the client-side portion of the
	// singleInstance enforcement.
	var singleInstance = false;
	var isGraphic = false;
	bundle.graphics.some(function (graphic) {
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
			singleInstance: singleInstance
		}, function (html) {
			res.send(html);
		});
	} else {
		res.sendFile(fileLocation);
	}
});

app.get('/graphics/:bundle/components/*', function (req, res, next) {
	var bundleName = req.params.bundle;
	var bundle = Bundles.find(bundleName);
	if (!bundle) {
		next();
		return;
	}

	var resName = req.params[0];
	var fileLocation = path.join(bundle.dir, 'bower_components', resName);

	// Check if the file exists
	if (!fs.existsSync(fileLocation)) {
		next();
		return;
	}

	res.sendFile(fileLocation);
});

module.exports = app;
