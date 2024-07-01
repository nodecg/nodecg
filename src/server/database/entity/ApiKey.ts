import { text, sqliteTable } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { user } from './User';

export const apiKey = sqliteTable('api_key', {
	secret_key: text('secret_key').$defaultFn(() => uuidv4()).primaryKey(),
	userId: text('userId').references(() => user.id)
});

export const apiKeyRelations = relations(apiKey, ({ one }) => {
	return {
		user: one(user, {
			fields: [apiKey.userId],
			references: [user.id]
		})
	}
});

export type ApiKey = typeof apiKey.$inferSelect;
