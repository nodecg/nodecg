import { text, sqliteTable, unique } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { user } from './User';

export const identity = sqliteTable('identity', {
	id: text('id').$defaultFn(() => uuidv4()).primaryKey(),
	provider_type: text('provider_type', { enum: ['twitch', 'steam', 'local', 'discord'] }).notNull(),
	provider_hash: text('provider_hash').notNull(),
	provider_access_token: text('provider_access_token'),
	provider_refresh_token: text('provider_refresh_token'),
	userId: text('userId').references(() => user.id)
}, (table) => {
	return {
		providerIdentity: unique().on(table.provider_type, table.provider_hash)
	}
});

export const identityRelations = relations(identity, ({ one }) => {
	return {
		user: one(user, {
			fields: [identity.userId],
			references: [user.id]
		})
	}
});

export type Identity = typeof identity.$inferSelect;
