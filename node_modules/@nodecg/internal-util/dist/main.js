"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLegacyProject = exports.rootPath = exports.getNodecgRoot = exports.nodecgPath = void 0;
var nodecg_path_1 = require("./nodecg-path");
Object.defineProperty(exports, "nodecgPath", { enumerable: true, get: function () { return nodecg_path_1.nodecgPath; } });
var nodecg_root_1 = require("./nodecg-root");
Object.defineProperty(exports, "getNodecgRoot", { enumerable: true, get: function () { return nodecg_root_1.getNodecgRoot; } });
Object.defineProperty(exports, "rootPath", { enumerable: true, get: function () { return nodecg_root_1.rootPath; } });
var project_type_1 = require("./project-type");
Object.defineProperty(exports, "isLegacyProject", { enumerable: true, get: function () { return project_type_1.isLegacyProject; } });
//# sourceMappingURL=main.js.map