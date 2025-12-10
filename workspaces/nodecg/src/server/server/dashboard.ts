import * as path from "node:path";

import { rootPaths } from "@nodecg/internal-util";
import { Effect } from "effect";
import express from "express";
import { klona as clone } from "klona/json";

import type { NodeCG } from "../../types/nodecg.js";
import { config, filteredConfig, sentryEnabled } from "../config/index.js";
import { authCheck } from "../util/authcheck.js";
import { injectScripts } from "../util/injectscripts.js";
import { sendFile } from "../util/send-file/index.js";
import { sendNodeModulesFile } from "../util/send-node-modules-file/index.js";
import type { BundleManager } from "./bundle-manager.js";

type Workspace = NodeCG.Workspace;

/**
 * Returns the sort category for an order value:
 * - 0: positive/zero (appears first)
 * - 1: undefined (appears in middle)
 * - 2: negative (appears last)
 */
function getOrderCategory(order: number | undefined): number {
	if (order === undefined) return 1;
	if (order >= 0) return 0;
	return 2;
}

interface DashboardContext {
	bundles: NodeCG.Bundle[];
	publicConfig: typeof filteredConfig;
	privateConfig: typeof config;
	workspaces: Workspace[];
	sentryEnabled: boolean;
}

export const dashboardRouter = Effect.fn("dashboardRouter")(function* (
	bundleManager: BundleManager,
) {
	const BUILD_PATH = path.join(rootPaths.nodecgInstalledPath, "dist/client");

	const app = express();

	let dashboardContext: DashboardContext | undefined = undefined;

	app.use(express.static(BUILD_PATH));

	app.use("/node_modules/:filePath(*)", (req, res, next) => {
		const startDir = rootPaths.nodecgInstalledPath;
		const limitDir = rootPaths.runtimeRootPath;
		const filePath = req.params.filePath!;
		sendNodeModulesFile(startDir, limitDir, filePath, res, next);
	});

	app.get("/", (_, res) => {
		res.redirect("/dashboard/");
	});

	app.get("/dashboard", authCheck, (req, res) => {
		if (!req.url.endsWith("/")) {
			res.redirect("/dashboard/");
			return;
		}

		if (!dashboardContext) {
			dashboardContext = getDashboardContext(bundleManager.all());
		}

		res.render(
			path.join(
				rootPaths.nodecgInstalledPath,
				"dist/server/templates/dashboard.tmpl",
			),
			dashboardContext,
		);
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
					standalone: Boolean(req.query.standalone),
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
		dashboardContext = undefined;
	});

	return app;
});

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
 * Parse workspaces from bundles, supporting:
 * - workspaceOrder property for custom ordering
 * - Negative order values to place workspaces at the end (like arr.at(-1))
 * - Alphabetical sorting for workspaces without order
 *
 * Workspaces are sorted in three categories:
 * 1. Positive/zero order values (sorted ascending)
 * 2. No order value (sorted alphabetically)
 * 3. Negative order values (sorted ascending, so -2 comes before -1)
 *
 * When multiple panels in different bundles define the same workspace with different orders,
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
					if (
						currentOrder === undefined ||
						panel.workspaceOrder < currentOrder
					) {
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
	// Sorting categories: positive/zero orders (front) → no order (middle) → negative orders (end)
	// This allows negative numbers to be used like JavaScript's arr.at(-1) to place items at the end
	workspaces.sort((a, b) => {
		const orderA = workspaceOrders.get(a.name);
		const orderB = workspaceOrders.get(b.name);

		const categoryA = getOrderCategory(orderA);
		const categoryB = getOrderCategory(orderB);

		// Different categories: sort by category
		if (categoryA !== categoryB) {
			return categoryA - categoryB;
		}

		// Same category: if both undefined, sort alphabetically
		if (categoryA === 1) {
			return a.label.localeCompare(b.label);
		}

		// Both have orders in same category: sort numerically, then alphabetically
		if (orderA !== orderB) {
			return orderA! - orderB!;
		}
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
