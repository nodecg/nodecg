import "reflect-metadata";

import path from "node:path";
import { DataSource } from "typeorm";
export * from "./entity";
import { ApiKey, Identity, Permission, Replicant, Role, User } from "./entity";
import { nodecgRootPath } from "../../../shared/utils/rootPath";

const testing = process.env.NODECG_TEST?.toLowerCase() === "true";

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
		: path.join(nodecgRootPath, "db/nodecg.sqlite3"),
	logging: false,
	entities: [ApiKey, Identity, Permission, Replicant, Role, User],
	migrations: [
		path.join(nodecgRootPath, "out/server/database/default/migration/*.js"),
	],
	migrationsRun: true,
	synchronize: false,
});
