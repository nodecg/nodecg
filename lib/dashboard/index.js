'use strict';

// Native
const fs = require('fs');
const path = require('path');
const pug = require('pug');

// Packages
const clone = require('clone');
const debounce = require('lodash.debounce');
const express = require('express');

// Ours
const configHelper = require('../config');
const log = require('../logger')('nodecg/lib/dashboard');
const bundles = require('../bundles');
const ncgUtils = require('../util');

const app = express();
const PUBLIC_PATH = path.join(__dirname, 'public');
const WEB_APP_MANIFEST_PATH = path.join(__dirname, 'manifest.json');
const SERVICE_WORKER_PATH = path.join(__dirname, 'service-worker.js');
let cachedDashboard = null;
const recacheDashboard = debounce(() => {
	cachedDashboard = renderDashboard();
}, 100);

log.trace('Adding Express routes');
app.use('/bower_components', express.static(path.resolve(__dirname, '../../bower_components')));
app.use('/dashboard', express.static(PUBLIC_PATH));
app.use('/manifest.json', (req, res) => res.sendFile(WEB_APP_MANIFEST_PATH));
app.use('/service-worker.js', (req, res) => res.sendFile(SERVICE_WORKER_PATH));
app.set('views', PUBLIC_PATH);

app.get('/', (req, res) => res.redirect('/dashboard/'));

app.get('/dashboard', ncgUtils.authCheck, (req, res) => {
	if (configHelper.config.developer) {
		res.send(renderDashboard());
	} else {
		res.status(200).send(cachedDashboard);
	}
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

// Initialize cache
recacheDashboard();

// When a bundle changes, re-cache the dashboard.
bundles.on('bundleChanged', recacheDashboard);
module.exports = app;

function renderDashboard() {
	return pug.renderFile(path.join(__dirname, 'src/dashboard.pug'), {
		bundles: bundles.all().map(bundle => {
			const cleanedBundle = clone(bundle);
			if (cleanedBundle.dashboardPanels) {
				cleanedBundle.dashboardPanels = cleanedBundle.dashboardPanels.forEach(panel => {
					delete panel.html;
				});
			}

			delete cleanedBundle.rawManifest;
			return cleanedBundle;
		}),
		publicConfig: configHelper.filteredConfig,
		privateConfig: configHelper.config,
		workspaces: parseWorkspaces()
	});
}

function parseWorkspaces() {
	const workspaceNames = new Set();
	bundles.all().forEach(bundle => {
		bundle.dashboard.panels.forEach(panel => {
			if (panel.workspace) {
				workspaceNames.add(panel.workspace);
			}
		});
	});

	const workspaces = [{
		name: 'default',
		route: ''
	}];

	workspaceNames.forEach(name => {
		if (name === 'default') {
			return;
		}

		workspaces.push({
			name,
			route: name
		});
	});

	return workspaces;
}
