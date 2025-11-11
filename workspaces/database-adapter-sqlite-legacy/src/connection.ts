import { dataSource } from "./datasource.ts";

let initialized = false;

export async function getConnection() {
	if (!initialized) {
		await dataSource.initialize();
		initialized = true;
	}

	return dataSource;
}
