import * as path from "node:path";

import { nodecgPath, rootPath } from "@nodecg/internal-util";
import express from "express";
import { klona as clone } from "klona/json";

import type { NodeCG } from "../../types/nodecg";
import type { BundleManager } from "../bundle-manager";
import { config, filteredConfig, sentryEnabled } from "../config";
import { authCheck } from "../util/authcheck";
import { injectScripts } from "../util/injectscripts";
import { sendFile } from "../util/send-file";
import { sendNodeModulesFile } from "../util/send-node-modules-file";

type Workspace = NodeCG.Workspace;

interface DashboardContext {
	bundles: NodeCG.Bundle[];
	publicConfig: typeof filteredConfig;
	privateConfig: typeof config;
	workspaces: Workspace[];
	sentryEnabled: boolean;
}

const BUILD_PATH = path.join(nodecgPath, "dist");

export class DashboardLib {
	app = express();

	dashboardContext: DashboardContext | undefined = undefined;

	constructor(bundleManager: BundleManager) {
		const { app } = this;

		app.use(express.static(BUILD_PATH));

		app.use("/node_modules/:filePath(.*)", (req, res, next) => {
			const rootNodeModulesPath = path.join(rootPath, "node_modules");
			const basePath = nodecgPath;
			const filePath = req.params["filePath"]!;
			sendNodeModulesFile(rootNodeModulesPath, basePath, filePath, res, next);
		});

		app.get("/", (_, res) => {
			res.redirect("/dashboard/");
		});

		app.get("/dashboard", authCheck, (req, res) => {
			if (!req.url.endsWith("/")) {
				res.redirect("/dashboard/");
				return;
			}

			if (!this.dashboardContext) {
				this.dashboardContext = getDashboardContext(bundleManager.all());
			}

			res.render(path.join(__dirname, "dashboard.tmpl"), this.dashboardContext);
		});

		app.get("/bundles/:bundleName/dashboard/*", authCheck, (req, res, next) => {
			const { bundleName } = req.params;
			const bundle = bundleManager.find(bundleName!);
			if (!bundle) {
				next();
				return;
			}

			const resName = req.params[0]!;
			// If the target file is a panel or dialog, inject the appropriate scripts.
			// Else, serve the file as-is.
			const panel = bundle.dashboard.panels.find((p) => p.file === resName);
			if (panel) {
				const resourceType = panel.dialog ? "dialog" : "panel";
				injectScripts(
					panel.html,
					resourceType,
					{
						createApiInstance: bundle,
						standalone: Boolean(req.query["standalone"]),
						fullbleed: panel.fullbleed,
						sound: bundle.soundCues && bundle.soundCues.length > 0,
					},
					(html) => res.send(html),
				);
			} else {
				const parentDir = bundle.dashboard.dir;
				const fileLocation = path.join(parentDir, resName);
				sendFile(parentDir, fileLocation, res, next);
			}
		});

		// When a bundle changes, delete the cached dashboard context
		bundleManager.on("bundleChanged", () => {
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
					// @ts-expect-error This is a performance hack.
					delete panel.html;
				});
			}

			return cleanedBundle;
		}),
		publicConfig: filteredConfig,
		privateConfig: config,
		workspaces: parseWorkspaces(bundles),
		sentryEnabled,
	};
}

/**
 * Parses bundles and generates workspace configuration for the dashboard.
 * Workspaces are sorted by workspaceOrder (ascending), with items without an order
 * placed after ordered items. When two workspaces have the same order value,
 * they are sorted alphabetically by label as a secondary criterion.
 */
export function parseWorkspaces(bundles: NodeCG.Bundle[]): Workspace[] {
	let defaultWorkspaceHasPanels = false;
	let otherWorkspacesHavePanels = false;
	const workspaces: Workspace[] = [];
	const workspaceNames = new Set<string>();
	const workspaceOrders = new Map<string, number>();
	
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
				
				// Track order for fullbleed panels too
				if (panel.workspaceOrder !== undefined) {
					workspaceOrders.set(workspaceName, panel.workspaceOrder);
				}
			} else if (panel.workspace === "default") {
				defaultWorkspaceHasPanels = true;
			} else {
				workspaceNames.add(panel.workspace);
				otherWorkspacesHavePanels = true;
				
				// Track the minimum order value for each workspace
				if (panel.workspaceOrder !== undefined) {
					const currentOrder = workspaceOrders.get(panel.workspace);
					if (currentOrder === undefined || panel.workspaceOrder < currentOrder) {
						workspaceOrders.set(panel.workspace, panel.workspaceOrder);
					}
				}
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

	// Sort workspaces by order first, then alphabetically
	workspaces.sort((a, b) => {
		const orderA = workspaceOrders.get(a.name);
		const orderB = workspaceOrders.get(b.name);

		// Both have orders: sort by order, then alphabetically if same order
		if (orderA !== undefined && orderB !== undefined) {
			if (orderA !== orderB) {
				return orderA - orderB;
			}
			// Same order: fall through to alphabetical sorting
		}
		// Only A has order: A comes first
		else if (orderA !== undefined) {
			return -1;
		}
		// Only B has order: B comes first
		else if (orderB !== undefined) {
			return 1;
		}

		// Both have same order or neither has order: sort alphabetically
		return a.label.localeCompare(b.label);
	});

	if (defaultWorkspaceHasPanels || !otherWorkspacesHavePanels) {
		workspaces.unshift({
			name: "default",
			label: otherWorkspacesHavePanels ? "Main Workspace" : "Workspace",
			route: "",
		});
	}

	return workspaces;
}
