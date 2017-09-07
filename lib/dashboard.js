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
const bundles = require('./bundle-manager');
const configHelper = require('./config/index');
const log = require('./logger')('nodecg/lib/dashboard');
const ncgUtils = require('./util/index');
const ravenConfig = require('./util/raven-config');

const app = express();
const SRC_PATH = path.join(__dirname, '../src');
const INSTRUMENTED_PATH = path.join(__dirname, '../instrumented');
const BUILD_PATH = path.join(__dirname, '../build/src');
let cachedDashboard = null;
const recacheDashboard = debounce(() => {
	cachedDashboard = renderDashboard();
}, 100);

log.trace('Adding Express routes');

app.use('/bower_components', express.static(path.resolve(__dirname, '../bower_components')));

app.get('/', (req, res) => res.redirect('/dashboard/'));

app.get('/dashboard', ncgUtils.authCheck, (req, res) => {
	if (!req.url.endsWith('/')) {
		return res.redirect('/dashboard/');
	}

	if (configHelper.config.developer) {
		res.send(renderDashboard());
	} else {
		res.status(200).send(cachedDashboard);
	}
});

if (process.env.NODECG_TEST || configHelper.config.developer) {
	app.get('/nodecg-api.min.js', (req, res) => {
		res.sendFile(path.join(process.env.NODECG_TEST ? INSTRUMENTED_PATH : BUILD_PATH, 'nodecg-api.min.js'));
	});

	app.get('/nodecg-api.min.js.map', (req, res) => {
		res.sendFile(path.join(process.env.NODECG_TEST ? INSTRUMENTED_PATH : BUILD_PATH, 'nodecg-api.min.js.map'));
	});

	if (process.env.NODECG_TEST) {
		log.warn('Serving instrumented (and also unbundled) files for testing');
		app.get('/*', (req, res, next) => {
			const resName = req.params[0];
			if (!resName.startsWith('dashboard/')) {
				return next();
			}

			const fp = path.join(INSTRUMENTED_PATH, resName);
			if (fs.existsSync(fp)) {
				return res.sendFile(fp, err => {
					if (err) {
						return next();
					}
				});
			}

			return next();
		});
	} else {
		log.warn('Serving unbundled files for development');
	}

	app.use('/', express.static(SRC_PATH));
} else {
	app.use('/', express.static(BUILD_PATH));
}

app.get('/bundles/:bundleName/dashboard/*', ncgUtils.authCheck, (req, res, next) => {
	const bundleName = req.params.bundleName;
	const bundle = bundles.find(bundleName);
	if (!bundle) {
		next();
		return;
	}

	const resName = req.params[0];
	// If the target file is a panel or dialog, inject the appropriate scripts.
	// Else, serve the file as-is.
	const panel = bundle.dashboardPanels.find(p => p.file === resName);
	if (panel) {
		const resourceType = panel.dialog ? 'dialog' : 'panel';
		ncgUtils.injectScripts(panel.html, resourceType, {
			createApiInstance: bundle,
			standalone: req.query.standalone,
			fullbleed: panel.fullbleed
		}, html => res.send(html));
	} else {
		const fileLocation = path.join(bundle.dashboard.dir, resName);
		res.sendFile(fileLocation, err => {
			if (err) {
				if (err.code === 'ENOENT') {
					return res.sendStatus(404);
				}

				return next();
			}
		});
	}
});

// Initialize cache
recacheDashboard();

// When a bundle changes, re-cache the dashboard.
bundles.on('bundleChanged', recacheDashboard);
module.exports = app;

function renderDashboard() {
	return pug.renderFile(path.join(__dirname, '../src/dashboard/dashboard.pug'), {
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
		workspaces: parseWorkspaces(),
		ravenConfig
	});
}

function parseWorkspaces() {
	let defaultWorkspaceHasPanels = false;
	let otherWorkspacesHavePanels = false;
	const workspaces = [];
	const workspaceNames = new Set();
	bundles.all().forEach(bundle => {
		bundle.dashboard.panels.forEach(panel => {
			if (panel.dialog) {
				return;
			}

			if (panel.fullbleed) {
				otherWorkspacesHavePanels = true;
				const workspaceName = `__nodecg_fullbleed__${bundle.name}_${panel.name}`;
				workspaces.push({
					name: workspaceName,
					label: panel.name,
					route: `fullbleed/${panel.name}`,
					fullbleed: true
				});
			} else if (panel.workspace === 'default') {
				defaultWorkspaceHasPanels = true;
			} else {
				workspaceNames.add(panel.workspace);
				otherWorkspacesHavePanels = true;
			}
		});
	});

	if (defaultWorkspaceHasPanels || !otherWorkspacesHavePanels) {
		workspaces.unshift({
			name: 'default',
			label: otherWorkspacesHavePanels ? 'Main Workspace' : 'Workspace',
			route: ''
		});
	}

	workspaceNames.forEach(name => {
		workspaces.push({
			name,
			label: name,
			route: `workspace/${name}`
		});
	});

	return workspaces;
}
