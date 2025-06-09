"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendFile = sendFile;
const node_path_1 = __importDefault(require("node:path"));
const is_child_path_1 = require("../is-child-path");
function sendFile(directoryToPreventTraversalOutOf, fileLocation, res, next) {
    if ((0, is_child_path_1.isChildPath)(directoryToPreventTraversalOutOf, fileLocation)) {
        res.sendFile(fileLocation, (error) => {
            if (!error) {
                return;
            }
            if (error.code === "ENOENT") {
                return res.type(node_path_1.default.extname(fileLocation)).sendStatus(404);
            }
            if (!res.headersSent) {
                return next(error);
            }
        });
    }
    else {
        res.sendStatus(404);
    }
}
//# sourceMappingURL=index.js.map