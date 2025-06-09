"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardLib = void 0;
const path = __importStar(require("node:path"));
const internal_util_1 = require("@nodecg/internal-util");
const express_1 = __importDefault(require("express"));
const json_1 = require("klona/json");
const config_1 = require("../config");
const authcheck_1 = require("../util/authcheck");
const injectscripts_1 = require("../util/injectscripts");
const send_file_1 = require("../util/send-file");
const send_node_modules_file_1 = require("../util/send-node-modules-file");
const BUILD_PATH = path.join(internal_util_1.nodecgPath, "dist");
class DashboardLib {
    app = (0, express_1.default)();
    dashboardContext = undefined;
    constructor(bundleManager) {
        const { app } = this;
        app.use(express_1.default.static(BUILD_PATH));
        app.use("/node_modules/:filePath(.*)", (req, res, next) => {
            const rootNodeModulesPath = path.join(internal_util_1.rootPath, "node_modules");
            const basePath = internal_util_1.nodecgPath;
            const filePath = req.params["filePath"];
            (0, send_node_modules_file_1.sendNodeModulesFile)(rootNodeModulesPath, basePath, filePath, res, next);
        });
        app.get("/", (_, res) => {
            res.redirect("/dashboard/");
        });
        app.get("/dashboard", authcheck_1.authCheck, (req, res) => {
            if (!req.url.endsWith("/")) {
                res.redirect("/dashboard/");
                return;
            }
            if (!this.dashboardContext) {
                this.dashboardContext = getDashboardContext(bundleManager.all());
            }
            res.render(path.join(__dirname, "dashboard.tmpl"), this.dashboardContext);
        });
        app.get("/bundles/:bundleName/dashboard/*", authcheck_1.authCheck, (req, res, next) => {
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
                const resourceType = panel.dialog ? "dialog" : "panel";
                (0, injectscripts_1.injectScripts)(panel.html, resourceType, {
                    createApiInstance: bundle,
                    standalone: Boolean(req.query["standalone"]),
                    fullbleed: panel.fullbleed,
                    sound: bundle.soundCues && bundle.soundCues.length > 0,
                }, (html) => res.send(html));
            }
            else {
                const parentDir = bundle.dashboard.dir;
                const fileLocation = path.join(parentDir, resName);
                (0, send_file_1.sendFile)(parentDir, fileLocation, res, next);
            }
        });
        // When a bundle changes, delete the cached dashboard context
        bundleManager.on("bundleChanged", () => {
            this.dashboardContext = undefined;
        });
    }
}
exports.DashboardLib = DashboardLib;
function getDashboardContext(bundles) {
    return {
        bundles: bundles.map((bundle) => {
            const cleanedBundle = (0, json_1.klona)(bundle);
            if (cleanedBundle.dashboard.panels) {
                cleanedBundle.dashboard.panels.forEach((panel) => {
                    // @ts-expect-error This is a performance hack.
                    delete panel.html;
                });
            }
            return cleanedBundle;
        }),
        publicConfig: config_1.filteredConfig,
        privateConfig: config_1.config,
        workspaces: parseWorkspaces(bundles),
        sentryEnabled: config_1.sentryEnabled,
    };
}
function parseWorkspaces(bundles) {
    let defaultWorkspaceHasPanels = false;
    let otherWorkspacesHavePanels = false;
    const workspaces = [];
    const workspaceNames = new Set();
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
            }
            else if (panel.workspace === "default") {
                defaultWorkspaceHasPanels = true;
            }
            else {
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
            name: "default",
            label: otherWorkspacesHavePanels ? "Main Workspace" : "Workspace",
            route: "",
        });
    }
    return workspaces;
}
//# sourceMappingURL=index.js.map