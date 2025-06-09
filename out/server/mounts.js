"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MountsLib = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const authcheck_1 = require("./util/authcheck");
const send_file_1 = require("./util/send-file");
class MountsLib {
    app = (0, express_1.default)();
    constructor(bundles) {
        bundles.forEach((bundle) => {
            bundle.mount.forEach((mount) => {
                this.app.get(`/bundles/${bundle.name}/${mount.endpoint}/*`, authcheck_1.authCheck, (req, res, next) => {
                    const resName = req.params[0];
                    const parentDir = path_1.default.join(bundle.dir, mount.directory);
                    const fileLocation = path_1.default.join(parentDir, resName);
                    (0, send_file_1.sendFile)(parentDir, fileLocation, res, next);
                });
            });
        });
    }
}
exports.MountsLib = MountsLib;
//# sourceMappingURL=mounts.js.map