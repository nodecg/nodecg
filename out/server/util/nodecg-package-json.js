"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodecgPackageJson = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
function recursivelyFindPackageJson(dir) {
    const packageJsonPath = node_path_1.default.join(dir, "package.json");
    if (node_fs_1.default.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(node_fs_1.default.readFileSync(packageJsonPath, "utf-8"));
        if (packageJson.name === "nodecg") {
            return packageJson;
        }
    }
    const parentDir = node_path_1.default.dirname(dir);
    if (dir === parentDir) {
        throw new Error("Could not find NodeCG root path");
    }
    return recursivelyFindPackageJson(parentDir);
}
exports.nodecgPackageJson = recursivelyFindPackageJson(__dirname);
//# sourceMappingURL=nodecg-package-json.js.map