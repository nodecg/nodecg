"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLegacyProject = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const nodecg_root_1 = require("./nodecg-root");
const rootPackageJson = node_fs_1.default.readFileSync(node_path_1.default.join(nodecg_root_1.rootPath, "package.json"), "utf-8");
exports.isLegacyProject = JSON.parse(rootPackageJson).name === "nodecg";
if (!exports.isLegacyProject) {
    console.warn("NodeCG is installed as a dependency. This is an experimental feature. Please report any issues you encounter.");
}
//# sourceMappingURL=project-type.js.map