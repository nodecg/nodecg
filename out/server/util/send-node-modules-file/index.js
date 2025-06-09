"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recursivelyFindFileInNodeModules = recursivelyFindFileInNodeModules;
exports.sendNodeModulesFile = sendNodeModulesFile;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const is_child_path_1 = require("../is-child-path");
const send_file_1 = require("../send-file");
function recursivelyFindFileInNodeModules(currentPath, rootNodeModulesPath, filePath) {
    const nodeModulesPath = node_path_1.default.join(currentPath, "node_modules");
    const fileFullPath = node_path_1.default.join(nodeModulesPath, filePath);
    if (!(0, is_child_path_1.isChildPath)(rootNodeModulesPath, fileFullPath)) {
        return undefined;
    }
    if (node_fs_1.default.existsSync(fileFullPath)) {
        return fileFullPath;
    }
    return recursivelyFindFileInNodeModules(node_path_1.default.join(currentPath, "../.."), rootNodeModulesPath, filePath);
}
function sendNodeModulesFile(rootNodeModulesPath, basePath, filePath, res, next) {
    const fileFullPath = recursivelyFindFileInNodeModules(basePath, rootNodeModulesPath, filePath);
    if (!fileFullPath) {
        res.sendStatus(404);
        return;
    }
    (0, send_file_1.sendFile)(rootNodeModulesPath, fileFullPath, res, next);
}
//# sourceMappingURL=index.js.map