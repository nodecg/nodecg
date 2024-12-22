import { dataSource } from './datasource';
export * from './entity';

let initialized = false;

export async function getConnection() {
	if (!initialized) {
		await dataSource.initialize();
		initialized = true;
	}

	return dataSource;
}
