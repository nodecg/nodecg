"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSource = void 0;
require("reflect-metadata");
const node_path_1 = __importDefault(require("node:path"));
const typeorm_1 = require("typeorm");
__exportStar(require("./entity"), exports);
const internal_util_1 = require("@nodecg/internal-util");
const entity_1 = require("./entity");
const _1669424617013_initialize_1 = require("./migration/1669424617013-initialize");
const _1669424781583_default_roles_1 = require("./migration/1669424781583-default-roles");
const testing = process.env["NODECG_TEST"]?.toLowerCase() === "true";
exports.dataSource = new typeorm_1.DataSource({
    type: "better-sqlite3",
    /**
     * TypeORM has this special :memory: key which indicates
     * that an in-memory version of SQLite should be used.
     *
     * I can't find ANY documentation on this,
     * only references to it in GitHub issue threads
     * and in the TypeORM source code.
     *
     * But, bad docs aside, it is still useful
     * and we use it for tests.
     */
    database: testing
        ? ":memory:"
        : node_path_1.default.join((0, internal_util_1.getNodecgRoot)(), "db/nodecg.sqlite3"),
    logging: false,
    entities: [entity_1.ApiKey, entity_1.Identity, entity_1.Permission, entity_1.Replicant, entity_1.Role, entity_1.User],
    migrations: [_1669424617013_initialize_1.initialize1669424617013, _1669424781583_default_roles_1.defaultRoles1669424781583],
    migrationsRun: true,
    synchronize: false,
});
//# sourceMappingURL=datasource.js.map