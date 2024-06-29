import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/server/database/entity',
	out: './src/server/database/migration',
	dialect: 'sqlite',
	dbCredentials: {
		url: './db/nodecg.sqlite3'
	}
});
