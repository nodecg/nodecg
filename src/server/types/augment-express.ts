import { DatabaseAdapter } from '../../types/database-adapter';

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		export interface Locals {
			databaseAdapter: DatabaseAdapter;
		}
	}
}
