import { text, primaryKey, sqliteTable } from "drizzle-orm/sqlite-core";

export const replicant = sqliteTable('replicant', {
	namespace: text('namespace').notNull(),
	name: text('name').notNull(),
	value: text('value').notNull()
}, table => {
	return {
		pk: primaryKey({ columns: [table.namespace, table.name]})
	}
});

export type Replicant = typeof replicant.$inferSelect;
