import { dataSource } from './datasource';
export * from './entity';

export const testing = process.env.NODECG_TEST?.toLowerCase() === 'true';

let initialized = false;

export async function getConnection() {
	if (!initialized) {
		await dataSource.initialize();
		initialized = true;
	}

	return dataSource;
}
