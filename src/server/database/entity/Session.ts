import { text, sqliteTable, integer, index } from "drizzle-orm/sqlite-core";

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	expiredAt: integer('expiredAt', { mode: 'timestamp' }).notNull(),
	json: text('json').notNull(),
	destroyedAt: integer('destroyedAt', { mode: 'timestamp' })
}, (table) => {
	return {
		expiredAtIdx: index('expiredAtIdx').on(table.expiredAt)
	}
});

export type Session = typeof session.$inferSelect;

// import type { ISession } from 'connect-typeorm';
// import { Column, Entity, Index, PrimaryColumn, DeleteDateColumn } from 'typeorm';
// import type { ValueTransformer } from 'typeorm';

// // Postgres returns string by default. Return number instead.
// const Bigint: ValueTransformer = {
// 	from: (value) => Number(value),
// 	to: (value) => (value === Infinity ? '+Infinity' : Number(value)),
// };

// @Entity()
// export class Session implements ISession {
// 	@Index()
// 	@Column('bigint', { transformer: Bigint })
// 	expiredAt = Date.now();

// 	@PrimaryColumn('varchar', { length: 255 })
// 	id = '';

// 	@Column('text')
// 	json = '';

// 	@DeleteDateColumn()
// 	public destroyedAt?: Date;
// }
