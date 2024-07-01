// Ours
import db, { initialize } from './database';
export * from './entity';

let initialized = false;

export function getConnection(): typeof db {
	if (!initialized) {
		initialize();

		initialized = true;
	}

	return db;
}
