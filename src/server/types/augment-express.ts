import type { DatabaseAdapter } from "@nodecg/database-adapter-types";

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		export interface Locals {
			databaseAdapter: DatabaseAdapter;
		}
	}
}
