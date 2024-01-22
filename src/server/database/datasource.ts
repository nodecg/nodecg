import * as path from 'node:path';

import 'reflect-metadata';
import { DataSource } from 'typeorm';
export * from './entity';

import { User } from './entity/User';
import { Session } from './entity/Session';
import { Role } from './entity/Role';
import { Replicant } from './entity/Replicant';
import { Permission } from './entity/Permission';
import { Identity } from './entity/Identity';
import { ApiKey } from './entity/ApiKey';
import { nodecgRootPath } from '../../shared/utils/rootPath';
import { NODECG_ROOT } from '../nodecg-root';

const dbPath = path.join(NODECG_ROOT, 'db/nodecg.sqlite3');
export const testing = process.env.NODECG_TEST?.toLowerCase() === 'true';

const dataSource = new DataSource({
	type: 'better-sqlite3',

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
	database: testing ? ':memory:' : dbPath,
	logging: false,
	entities: [ApiKey, Identity, Permission, Replicant, Role, Session, User],
	migrations: [path.join(nodecgRootPath, 'out/server/database/migration/*.js')],
	migrationsRun: true,
	synchronize: false,
});

export default dataSource;
