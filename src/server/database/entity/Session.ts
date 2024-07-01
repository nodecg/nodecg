import { text, sqliteTable } from "drizzle-orm/sqlite-core";

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	json: text('json').notNull(),
});

export type Session = typeof session.$inferSelect;
