import "reflect-metadata";

import path from "node:path";

import { DataSource } from "typeorm";
export * from "./entity";
import { getNodecgRoot } from "@nodecg/internal-util";

import { ApiKey, Identity, Permission, Replicant, Role, User } from "./entity";
import { initialize1669424617013 } from "./migration/1669424617013-initialize";
import { defaultRoles1669424781583 } from "./migration/1669424781583-default-roles";

const testing = process.env["NODECG_TEST"]?.toLowerCase() === "true";

export const dataSource = new DataSource({
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
		: path.join(getNodecgRoot(), "db/nodecg.sqlite3"),
	logging: false,
	entities: [ApiKey, Identity, Permission, Replicant, Role, User],
	migrations: [initialize1669424617013, defaultRoles1669424781583],
	migrationsRun: true,
	synchronize: false,
});
