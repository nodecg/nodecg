import { Entity, PrimaryColumn, Column } from 'typeorm';

import { text, primaryKey, sqliteTable } from "drizzle-orm/sqlite-core";

export const replicant = sqliteTable('replicant', {
	namespace: text('namespace').notNull(),
	name: text('name').notNull(),
	value: text('value', { mode: 'json' }).notNull()
}, table => {
	return {
		pk: primaryKey({ columns: [table.name, table.name]})
	}
});

@Entity()
export class Replicant {
	@PrimaryColumn('text')
	namespace!: string;

	@PrimaryColumn('text')
	name!: string;

	@Column('text')
	value!: string;
}
