import type { DatabaseAdapter } from "@nodecg-release-test/database-adapter-types";

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		export interface Locals {
			databaseAdapter: DatabaseAdapter;
		}
	}
}
