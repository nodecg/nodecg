"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphicsLib = void 0;
const internal_util_1 = require("@nodecg/internal-util");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const authcheck_1 = require("../util/authcheck");
const injectscripts_1 = require("../util/injectscripts");
const send_file_1 = require("../util/send-file");
const send_node_modules_file_1 = require("../util/send-node-modules-file");
const registration_1 = require("./registration");
class GraphicsLib {
    app = (0, express_1.default)();
    constructor(io, bundleManager, replicator) {
        const { app } = this;
        // Start up the registration lib, which tracks how many instances of
        // a graphic are open, and enforces singleInstance behavior.
        app.use(new registration_1.RegistrationCoordinator(io, bundleManager, replicator).app);
        app.get("/bundles/:bundleName/graphics*", authcheck_1.authCheck, (req, res, next) => {
            const { bundleName } = req.params;
            const bundle = bundleManager.find(bundleName);
            if (!bundle) {
                next();
                return;
            }
            // We start out assuming the user is trying to reach the index page
            let resName = "index.html";
            // We need a trailing slash for view index pages so that relatively linked assets can be reached as expected.
            if (req.path.endsWith(`/${bundleName}/graphics`)) {
                res.redirect(`${req.url}/`);
                return;
            }
            // If the url path has more params beyond just /graphics/,
            // then the user is trying to resolve an asset and not the index page.
            if (!req.path.endsWith(`/${bundleName}/graphics/`)) {
                resName = req.params[0];
            }
            // Set a flag if this graphic is one we should enforce singleInstance behavior on.
            // This flag is passed to injectScripts, which then injects the client-side portion of the
            // singleInstance enforcement.
            let isGraphic = false;
            bundle.graphics.some((graphic) => {
                if (`/${graphic.file}` === resName || graphic.file === resName) {
                    isGraphic = true;
                    return true;
                }
                return false;
            });
            const parentDir = path_1.default.join(bundle.dir, "graphics");
            const fileLocation = path_1.default.join(parentDir, resName);
            // If this file is a main HTML file for a graphic, inject the graphic setup scripts.
            if (isGraphic) {
                (0, injectscripts_1.injectScripts)(fileLocation, "graphic", {
                    createApiInstance: bundle,
                    sound: bundle.soundCues && bundle.soundCues.length > 0,
                }, (html) => res.send(html));
            }
            else {
                (0, send_file_1.sendFile)(parentDir, fileLocation, res, next);
            }
        });
        app.get("/bundles/:bundleName/bower_components/:filePath(.*)", (req, res, next) => {
            const { bundleName } = req.params;
            const bundle = bundleManager.find(bundleName);
            if (!bundle) {
                next();
                return;
            }
            const resName = req.params["filePath"];
            const parentDir = path_1.default.join(bundle.dir, "bower_components");
            const fileLocation = path_1.default.join(parentDir, resName);
            (0, send_file_1.sendFile)(parentDir, fileLocation, res, next);
        });
        // This isn't really a graphics-specific thing, should probably be in the main server lib.
        app.get("/bundles/:bundleName/node_modules/:filePath(.*)", (req, res, next) => {
            const { bundleName } = req.params;
            const bundle = bundleManager.find(bundleName);
            if (!bundle) {
                next();
                return;
            }
            const filePath = req.params["filePath"];
            if (internal_util_1.isLegacyProject) {
                const parentDir = path_1.default.join(bundle.dir, "node_modules");
                const fileLocation = path_1.default.join(parentDir, filePath);
                (0, send_file_1.sendFile)(parentDir, fileLocation, res, next);
            }
            else {
                const rootNodeModulesPath = path_1.default.join(internal_util_1.rootPath, "node_modules");
                const basePath = bundle.dir;
                (0, send_node_modules_file_1.sendNodeModulesFile)(rootNodeModulesPath, basePath, filePath, res, next);
            }
        });
    }
}
exports.GraphicsLib = GraphicsLib;
//# sourceMappingURL=index.js.map