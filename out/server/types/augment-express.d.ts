import type { DatabaseAdapter } from "@nodecg/database-adapter-types";
declare global {
    namespace Express {
        interface Locals {
            databaseAdapter: DatabaseAdapter;
        }
    }
}
