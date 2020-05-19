// Native
import path from 'path';
import fs from 'fs';

// Packages
import 'reflect-metadata';
import { createConnection, Connection } from 'typeorm';
import appRootPath from 'app-root-path';
export * from './entity';

// Ours
import createLogger from '../logger';

const log = createLogger('database');
const dbPath = path.join(appRootPath.path, 'db/nodecg.sqlite3');
let memoizedConnection: Connection;
export async function getConnection(): Promise<Connection> {
	if (!memoizedConnection) {
		const testing = process.env.NODECG_TEST?.toLowerCase() === 'true';
		if (testing) {
			log.warn('Using in-memory test database.');
		}

		memoizedConnection = await createConnection({
			type: 'sqlite',

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
			entities: [path.join(appRootPath.path, 'build/server/database/entity/**/*.js')],
			migrations: [path.join(appRootPath.path, 'build/server/database/migration/**/*.js')],
			subscribers: [path.join(appRootPath.path, 'build/server/database/subscriber/**/*.js')],
			migrationsRun: true,

			/**
			 * If the database doesn't exist yet (or if we are testing),
			 * then we need to create it and fill it with our schemas.
			 */
			synchronize: testing || !fs.existsSync(dbPath),
		});
	}

	return memoizedConnection;
}
