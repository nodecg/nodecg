import * as path from 'node:path';

import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from 'better-sqlite3';

import { nodecgRootPath } from '../../shared/utils/rootPath';
import createLogger from '../logger';
import { isTesting } from './../util';
import * as schema from './entity';
import { DefaultLogger, LogWriter } from 'drizzle-orm';

export const SUPERUSER_ROLE_ID = '07e18d80-fa74-4d98-ac18-838c745a480f';
const PERMISSION_ID = '923561ef-4186-4370-b7df-f12e64fc7bd2';

const log = createLogger('database');

class NodeCGDrizzleLogger implements LogWriter {
	write(message: string): void {
		log.trace(message);
	}
}

const dbPath = path.join(nodecgRootPath, 'db/nodecg.sqlite3');
const migrationsPath = path.join(nodecgRootPath, 'db/migrations');

// When testing, we specifically use SQLite's in-memory storage.
// This allows us to use SQLite as normal when running tests without any data being persisted on disk.
const sqlite = new Database(isTesting() ? ':memory:' : dbPath);
const db = drizzle(sqlite, {
	logger: new DefaultLogger({ writer: new NodeCGDrizzleLogger() }),
	schema: { ...schema.tables, ...schema.relations }
});

export async function initialize() {
	if (isTesting()) {
		log.warn('Using in-memory test database.');
	}

	migrate(db, { migrationsFolder: migrationsPath });

	await db.insert(schema.tables.role).values({ id: SUPERUSER_ROLE_ID, name: 'superuser' });
	await db.insert(schema.tables.permission).values({
		name: 'superuser',
		id: PERMISSION_ID,
		roleId: SUPERUSER_ROLE_ID,
		entityId: '*',
		actions: schema.Action.READ | schema.Action.WRITE
	});
}

export default db;
