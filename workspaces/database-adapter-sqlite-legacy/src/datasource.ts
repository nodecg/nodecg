import path from "node:path";

import { rootPaths } from "@nodecg/internal-util";
import sqlite3 from "better-sqlite3";
import { DataSource } from "typeorm";

import { ApiKey } from "./entity/ApiKey.js";
import { Identity } from "./entity/Identity.js";
import { Permission } from "./entity/Permission.js";
import { Replicant } from "./entity/Replicant.js";
import { Role } from "./entity/Role.js";
import { User } from "./entity/User.js";
import { initialize1669424617013 } from "./migration/1669424617013-initialize.js";
import { defaultRoles1669424781583 } from "./migration/1669424781583-default-roles.js";

const testing = process.env["NODECG_TEST"]?.toLowerCase() === "true";

export const dataSource = new DataSource({
	type: "better-sqlite3",
	driver: sqlite3,

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
		: path.join(rootPaths.getRuntimeRoot(), "db/nodecg.sqlite3"),
	logging: false,
	entities: [ApiKey, Identity, Permission, Replicant, Role, User],
	migrations: [initialize1669424617013, defaultRoles1669424781583],
	migrationsRun: true,
	synchronize: false,
});
