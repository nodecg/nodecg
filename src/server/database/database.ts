import * as path from 'node:path';

import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from 'better-sqlite3';

import { nodecgRootPath } from '../../shared/utils/rootPath';
import createLogger from '../logger';
import * as schema from './entity';
import { DefaultLogger, LogWriter } from 'drizzle-orm';

const log = createLogger('database');

class NodeCGDrizzleLogger implements LogWriter {
	write(message: string): void {
		log.trace(message);
	}
}

const dbPath = path.join(nodecgRootPath, 'db/nodecg.sqlite3');
const migrationsPath = path.join(nodecgRootPath, 'db/migrations');
const testing = process.env.NODECG_TEST?.toLowerCase() === 'true';

// When testing, we specifically use SQLite's in-memory storage.
// This allows us to use SQLite as normal when running tests without any data being persisted on disk.
const sqlite = new Database(testing ? ':memory:' : dbPath);
const db = drizzle(sqlite, {
	logger: new DefaultLogger({ writer: new NodeCGDrizzleLogger() }),
	schema: { ...schema.tables, ...schema.relations }
});

export function initialize() {
	if (testing) {
		log.warn('Using in-memory test database.');
	}

	migrate(db, { migrationsFolder: migrationsPath });
}

export default db;
