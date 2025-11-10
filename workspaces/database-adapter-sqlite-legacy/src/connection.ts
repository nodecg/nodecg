import { dataSource } from "./datasource.js";

export * from "./entity/index.js";

let initialized = false;

export async function getConnection() {
	if (!initialized) {
		await dataSource.initialize();
		initialized = true;
	}

	return dataSource;
}
