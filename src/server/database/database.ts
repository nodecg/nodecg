import * as path from 'node:path';

import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from 'better-sqlite3';

import { nodecgRootPath } from '../../shared/utils/rootPath';
import createLogger from '../logger';
import { Action, permission } from './entity/Permission';
import { role } from './entity';
import * as schema from './entity';

const ROLE_ID = '07e18d80-fa74-4d98-ac18-838c745a480f';
const PERMISSION_ID = '923561ef-4186-4370-b7df-f12e64fc7bd2';

const log = createLogger('database');

const dbPath = path.join(nodecgRootPath, 'db/nodecg.sqlite3');
const migrationsPath = path.join(nodecgRootPath, 'db/migrations');
// TODO: This is a different way of checking if we're in a testing environment than other places. Standardize on an approach, and provide one means of checking if we're in a testing environment.
const testing = process.env.NODECG_TEST?.toLowerCase() === 'true';

// When testing, we specifically use SQLite's in-memory storage.
// This allows us to use SQLite as normal when running tests without any data being persisted on disk.
const sqlite = new Database(testing ? ':memory:' : dbPath);
const db = drizzle(sqlite, { schema: { ...schema } });

export async function initialize() {
	if (testing) {
		log.warn('Using in-memory test database.');
	}

	migrate(db, { migrationsFolder: migrationsPath });

	await db.insert(role).values({ id: ROLE_ID, name: 'superuser' });
	await db.insert(permission).values({
		name: 'superuser',
		id: PERMISSION_ID,
		roleId: ROLE_ID,
		entityId: '*',
		actions: Action.READ | Action.WRITE
	});
}

export default db;
