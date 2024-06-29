// Ours
import db, { initialize } from './database';
export * from './entity';

let initialized = false;

export async function getConnection(): Promise<typeof db> {
	if (!initialized) {
		await initialize();

		initialized = true;
	}

	return db;
}
