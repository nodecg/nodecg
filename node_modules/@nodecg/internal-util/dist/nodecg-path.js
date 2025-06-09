"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodecgPath = void 0;
const node_path_1 = __importDefault(require("node:path"));
const nodecg_root_1 = require("./nodecg-root");
const project_type_1 = require("./project-type");
exports.nodecgPath = project_type_1.isLegacyProject
    ? nodecg_root_1.rootPath
    : node_path_1.default.join(nodecg_root_1.rootPath, "node_modules/nodecg");
//# sourceMappingURL=nodecg-path.js.map