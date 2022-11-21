// Native
import path from 'path';

// Packages
import clone from 'clone';
import express from 'express';
import appRootPath from 'app-root-path';

// Ours
import { config, filteredConfig } from '../config';
import * as ncgUtils from '../util';
import type BundleManager from '../bundle-manager';
import type { NodeCG } from '../../types/nodecg';

type Workspace = NodeCG.Workspace;

type DashboardContext = {
	bundles: NodeCG.Bundle[];
	publicConfig: typeof filteredConfig;
	privateConfig: typeof config;
	workspaces: Workspace[];
	sentryEnabled: boolean;
};

const BUILD_PATH = path.join(appRootPath.path, 'build/client');
const VIEWS_PATH = path.join(appRootPath.path, 'src/server/dashboard');

export default class DashboardLib {
	app = express();

	dashboardContext: DashboardContext | undefined = undefined;

	constructor(bundleManager: BundleManager) {
		const { app } = this;

		app.set('views', VIEWS_PATH);

		app.use(express.static(BUILD_PATH));

		app.use('/node_modules', express.static(path.join(appRootPath.path, 'node_modules')));

		app.get('/', (_, res) => {
			res.redirect('/dashboard/');
		});

		app.get('/dashboard', ncgUtils.authCheck, (req, res) => {
			if (!req.url.endsWith('/')) {
				res.redirect('/dashboard/');
				return;
			}

			if (!this.dashboardContext) {
				this.dashboardContext = getDashboardContext(bundleManager.all());
			}

			res.render(path.join(VIEWS_PATH, 'dashboard.tmpl'), this.dashboardContext);
		});

		app.get('/nodecg-api.min.js', (_, res) => {
			res.sendFile(path.join(BUILD_PATH, 'api.js'));
		});

		app.get('/nodecg-api.min.js.map', (_, res) => {
			res.sendFile(path.join(BUILD_PATH, 'api.js.map'));
		});

		app.get('/bundles/:bundleName/dashboard/*', ncgUtils.authCheck, (req, res, next) => {
			const { bundleName } = req.params;
			const bundle = bundleManager.find(bundleName);
			if (!bundle) {
				next();
				return;
			}

			const resName = req.params[0];
			// If the target file is a panel or dialog, inject the appropriate scripts.
			// Else, serve the file as-is.
			const panel = bundle.dashboard.panels.find((p) => p.file === resName);
			if (panel) {
				const resourceType = panel.dialog ? 'dialog' : 'panel';
				ncgUtils.injectScripts(
					panel.html,
					resourceType,
					{
						createApiInstance: bundle,
						standalone: Boolean(req.query.standalone),
						fullbleed: panel.fullbleed,
					},
					(html) => res.send(html),
				);
			} else {
				const fileLocation = path.join(bundle.dashboard.dir, resName);
				ncgUtils.sendFile(fileLocation, res, next);
			}
		});

		// When a bundle changes, delete the cached dashboard context
		bundleManager.on('bundleChanged', () => {
			this.dashboardContext = undefined;
		});
	}
}

function getDashboardContext(bundles: NodeCG.Bundle[]): DashboardContext {
	return {
		bundles: bundles.map((bundle) => {
			const cleanedBundle = clone(bundle);
			if (cleanedBundle.dashboard.panels) {
				cleanedBundle.dashboard.panels.forEach((panel) => {
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
					delete (panel as any).html;
				});
			}

			return cleanedBundle;
		}),
		publicConfig: filteredConfig,
		privateConfig: config,
		workspaces: parseWorkspaces(bundles),
		sentryEnabled: global.sentryEnabled,
	};
}

function parseWorkspaces(bundles: NodeCG.Bundle[]): Workspace[] {
	let defaultWorkspaceHasPanels = false;
	let otherWorkspacesHavePanels = false;
	const workspaces: Workspace[] = [];
	const workspaceNames = new Set<string>();
	bundles.forEach((bundle) => {
		bundle.dashboard.panels.forEach((panel) => {
			if (panel.dialog) {
				return;
			}

			if (panel.fullbleed) {
				otherWorkspacesHavePanels = true;
				const workspaceName = `__nodecg_fullbleed__${bundle.name}_${panel.name}`;
				workspaces.push({
					name: workspaceName,
					label: panel.title,
					route: `fullbleed/${panel.name}`,
					fullbleed: true,
				});
			} else if (panel.workspace === 'default') {
				defaultWorkspaceHasPanels = true;
			} else {
				workspaceNames.add(panel.workspace);
				otherWorkspacesHavePanels = true;
			}
		});
	});

	workspaceNames.forEach((name) => {
		workspaces.push({
			name,
			label: name,
			route: `workspace/${name}`,
		});
	});

	workspaces.sort((a, b) => a.label.localeCompare(b.label));

	if (defaultWorkspaceHasPanels || !otherWorkspacesHavePanels) {
		workspaces.unshift({
			name: 'default',
			label: otherWorkspacesHavePanels ? 'Main Workspace' : 'Workspace',
			route: '',
		});
	}

	return workspaces;
}
