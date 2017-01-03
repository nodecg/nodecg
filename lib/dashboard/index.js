'use strict';

const fs = require('fs');
const express = require('express');
const configHelper = require('../config');
const log = require('../logger')('nodecg/lib/dashboard');
const bundles = require('../bundles');
const path = require('path');
const ncgUtils = require('../util');
const jade = require('jade');
const app = express();
const publicPath = path.join(__dirname, 'public');
let cachedDashboard = null;

log.trace('Adding Express routes');
app.use('/dashboard', express.static(publicPath));
app.set('views', publicPath);

app.get('/', (req, res) => res.redirect('/dashboard/'));

app.get('/dashboard', ncgUtils.authCheck, (req, res) => {
	if (configHelper.config.developer) {
		res.render(path.join(__dirname, 'src/dashboard.jade'), {
			bundles: bundles.all(),
			publicConfig: configHelper.filteredConfig,
			privateConfig: configHelper.config
		});
	} else {
		res.status(200).send(cachedDashboard);
	}
});

/* The font-roboto Polymer component makes a request to Google's servers to load the font file.
 * This takes a very long time, sometimes up to a second per request.
 * Many Polymer components include this element, so nearly every panel is making this request.
 * To reduce load times, we check to see if the resource being requested is the font-roboto component.
 * If so, we return our own local instance of the Roboto webfont.
 */
app.get('/panel/:bundleName/components/font-roboto/roboto.html', (req, res) => {
	res.send(
		'<link rel="stylesheet" href="/dashboard/font/Roboto/roboto.css">' +
		'<link rel="stylesheet" href="/dashboard/font/Roboto_Mono/roboto_mono.css">'
	);
});

app.get('/panel/:bundle/components/*', (req, res, next) => {
	const bundleName = req.params.bundle;
	const bundle = bundles.find(bundleName);
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

app.get('/panel/:bundle/*', ncgUtils.authCheck, (req, res, next) => {
	const bundleName = req.params.bundle;
	const bundle = bundles.find(bundleName);
	if (!bundle) {
		next();
		return;
	}

	const resName = req.params[0];
	const fileLocation = path.join(bundle.dashboard.dir, resName);

	// Check if the file exists
	if (!fs.existsSync(fileLocation)) {
		next();
		return;
	}

	// If the target file is a panel or dialog, inject the appropriate scripts.
	// Else, serve the file as-is.
	const panel = bundle.dashboardPanels.find(p => p.file === resName);
	if (panel) {
		const resourceType = panel.dialog ? 'dialog' : 'panel';
		ncgUtils.injectScripts(panel.html, resourceType, {
			createApiInstance: bundle,
			standalone: req.query.standalone
		}, html => res.send(html));
	} else {
		res.sendFile(fileLocation);
	}
});

function cacheDashboard() {
	cachedDashboard = jade.renderFile(path.join(__dirname, 'src/dashboard.jade'), {
		bundles: bundles.all(),
		publicConfig: configHelper.filteredConfig,
		privateConfig: configHelper.config
	});
}

// Initialize cache
cacheDashboard();

// When a panel is re-parsed, re-render and cache the dashboard
bundles.on('bundleChanged', cacheDashboard);

module.exports = app;
