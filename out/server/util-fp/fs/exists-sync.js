"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.existsSync = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const existsSync = (path) => () => node_fs_1.default.existsSync(path);
exports.existsSync = existsSync;
//# sourceMappingURL=exists-sync.js.map