// Packages
import { type DataSource } from "typeorm";

// Ours
import createLogger from "../../logger";
import dataSource, { testing } from "./datasource";
export * from "./entity";

const log = createLogger("database");
let initialized = false;

export async function getConnection(): Promise<DataSource> {
	if (!initialized) {
		if (testing) {
			log.warn("Using in-memory test database.");
		}

		await dataSource.initialize();
		initialized = true;
	}

	return dataSource;
}
