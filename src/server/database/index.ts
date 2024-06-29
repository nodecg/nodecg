// Packages
import { type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

// Ours
import db, { initialize } from './database';
export * from './entity';

let initialized = false;

export async function getConnection(): Promise<BetterSQLite3Database> {
	if (!initialized) {
		await initialize();

		initialized = true;
	}

	return db;
}
