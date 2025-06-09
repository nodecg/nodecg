"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationCoordinator = void 0;
const internal_util_1 = require("@nodecg/internal-util");
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const injectscripts_1 = require("../util/injectscripts");
const is_child_path_1 = require("../util/is-child-path");
const BUILD_PATH = path_1.default.join(internal_util_1.nodecgPath, "dist/instance");
class RegistrationCoordinator {
    app = (0, express_1.default)();
    _instancesRep;
    _bundleManager;
    constructor(io, bundleManager, replicator) {
        this._bundleManager = bundleManager;
        const { app } = this;
        this._instancesRep = replicator.declare("graphics:instances", "nodecg", {
            schemaPath: path_1.default.resolve(internal_util_1.nodecgPath, "schemas/graphics%3Ainstances.json"),
            persistent: false,
            defaultValue: [],
        });
        bundleManager.on("bundleChanged", this._updateInstanceStatuses.bind(this));
        bundleManager.on("gitChanged", this._updateInstanceStatuses.bind(this));
        io.on("connection", (socket) => {
            socket.on("graphic:registerSocket", (regRequest, cb) => {
                const { bundleName } = regRequest;
                let { pathName } = regRequest;
                if (pathName.endsWith(`/${bundleName}/graphics/`)) {
                    pathName += "index.html";
                }
                const bundle = bundleManager.find(bundleName);
                /* istanbul ignore if: simple error trapping */
                if (!bundle) {
                    cb(undefined, false);
                    return;
                }
                const graphicManifest = this._findGraphicManifest({
                    bundleName,
                    pathName,
                });
                /* istanbul ignore if: simple error trapping */
                if (!graphicManifest) {
                    cb(undefined, false);
                    return;
                }
                const existingSocketRegistration = this._findRegistrationBySocketId(socket.id);
                const existingPathRegistration = this._findOpenRegistrationByPathName(pathName);
                // If there is an existing registration with this pathName,
                // and this is a singleInstance graphic,
                // then deny the registration, unless the socket ID matches.
                if (existingPathRegistration && graphicManifest.singleInstance) {
                    if (existingPathRegistration.socketId === socket.id) {
                        cb(undefined, true);
                        return;
                    }
                    cb(undefined, !existingPathRegistration.open);
                    return;
                }
                if (existingSocketRegistration) {
                    existingSocketRegistration.open = true;
                }
                else {
                    this._addRegistration({
                        ...regRequest,
                        ipv4: socket.request.socket.remoteAddress,
                        socketId: socket.id,
                        singleInstance: Boolean(graphicManifest.singleInstance),
                        potentiallyOutOfDate: calcBundleGitMismatch(bundle, regRequest) ||
                            calcBundleVersionMismatch(bundle, regRequest),
                        open: true,
                    });
                    if (graphicManifest.singleInstance) {
                        app.emit("graphicOccupied", pathName);
                    }
                }
                cb(undefined, true);
            });
            socket.on("graphic:queryAvailability", (pathName, cb) => {
                cb(undefined, !this._findOpenRegistrationByPathName(pathName));
            });
            socket.on("graphic:requestBundleRefresh", (bundleName, cb) => {
                const bundle = bundleManager.find(bundleName);
                if (!bundle) {
                    cb(undefined, undefined);
                    return;
                }
                io.emit("graphic:bundleRefresh", bundleName);
                cb(undefined, undefined);
            });
            socket.on("graphic:requestRefreshAll", (graphic, cb) => {
                io.emit("graphic:refreshAll", graphic);
                if (typeof cb === "function") {
                    cb(undefined, undefined);
                }
            });
            socket.on("graphic:requestRefresh", (instance, cb) => {
                io.emit("graphic:refresh", instance);
                cb(undefined, undefined);
            });
            socket.on("graphic:requestKill", (instance, cb) => {
                io.emit("graphic:kill", instance);
                cb(undefined, undefined);
            });
            socket.on("disconnect", () => {
                // Unregister the socket.
                const registration = this._findRegistrationBySocketId(socket.id);
                if (!registration) {
                    return;
                }
                registration.open = false;
                if (registration.singleInstance) {
                    app.emit("graphicAvailable", registration.pathName);
                }
                setTimeout(() => {
                    this._removeRegistration(socket.id);
                }, 1000);
            });
        });
        app.get("/instance/*", (req, res, next) => {
            const resName = req.path.split("/").slice(2).join("/");
            // If it's a HTML file, inject the graphic setup script and serve that
            // otherwise, send the file unmodified
            const fileLocation = path_1.default.join(BUILD_PATH, resName);
            if (resName.endsWith(".html") && (0, is_child_path_1.isChildPath)(BUILD_PATH, fileLocation)) {
                if (fs_1.default.existsSync(fileLocation)) {
                    (0, injectscripts_1.injectScripts)(fileLocation, "graphic", {}, (html) => res.send(html));
                }
                else {
                    next();
                }
            }
            else {
                next();
            }
        });
    }
    _addRegistration(registration) {
        this._instancesRep.value.push({
            ...registration,
            open: true,
        });
    }
    _removeRegistration(socketId) {
        const registrationIndex = this._instancesRep.value.findIndex((instance) => instance.socketId === socketId);
        /* istanbul ignore next: simple error trapping */
        if (registrationIndex < 0) {
            return false;
        }
        return this._instancesRep.value.splice(registrationIndex, 1)[0];
    }
    _findRegistrationBySocketId(socketId) {
        return this._instancesRep.value.find((instance) => instance.socketId === socketId);
    }
    _findOpenRegistrationByPathName(pathName) {
        return this._instancesRep.value.find((instance) => instance.pathName === pathName && instance.open);
    }
    _updateInstanceStatuses() {
        this._instancesRep.value.forEach((instance) => {
            const { bundleName, pathName } = instance;
            const bundle = this._bundleManager.find(bundleName);
            /* istanbul ignore next: simple error trapping */
            if (!bundle) {
                return;
            }
            const graphicManifest = this._findGraphicManifest({
                bundleName,
                pathName,
            });
            /* istanbul ignore next: simple error trapping */
            if (!graphicManifest) {
                return;
            }
            instance.potentiallyOutOfDate =
                calcBundleGitMismatch(bundle, instance) ||
                    calcBundleVersionMismatch(bundle, instance);
            instance.singleInstance = Boolean(graphicManifest.singleInstance);
        });
    }
    _findGraphicManifest({ pathName, bundleName, }) {
        const bundle = this._bundleManager.find(bundleName);
        /* istanbul ignore if: simple error trapping */
        if (!bundle) {
            return;
        }
        return bundle.graphics.find((graphic) => graphic.url === pathName);
    }
}
exports.RegistrationCoordinator = RegistrationCoordinator;
function calcBundleGitMismatch(bundle, regRequest) {
    if (regRequest.bundleGit && !bundle.git) {
        return true;
    }
    if (!regRequest.bundleGit && bundle.git) {
        return true;
    }
    if (!regRequest.bundleGit && !bundle.git) {
        return false;
    }
    return regRequest.bundleGit.hash !== bundle.git.hash;
}
function calcBundleVersionMismatch(bundle, regRequest) {
    return bundle.version !== regRequest.bundleVersion;
}
//# sourceMappingURL=registration.js.map