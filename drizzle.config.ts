import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/server/database/entity',
	out: './db/migrations',
	dialect: 'sqlite',
	dbCredentials: {
		url: './db/nodecg.sqlite3'
	}
});
