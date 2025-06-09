"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChildPath = isChildPath;
const path_1 = __importDefault(require("path"));
/**
 * Checks if a given path (dirOrFile) is a child of another given path (parent).
 */
function isChildPath(parent, dirOrFile) {
    if (!path_1.default.isAbsolute(parent) || !path_1.default.isAbsolute(dirOrFile)) {
        throw new Error("Both paths must be absolute paths");
    }
    const relative = path_1.default.relative(parent, dirOrFile);
    return (Boolean(relative) &&
        !relative.startsWith("..") &&
        !path_1.default.isAbsolute(relative));
}
//# sourceMappingURL=is-child-path.js.map