import { text, sqliteTable } from "drizzle-orm/sqlite-core";
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
export type NewIdentity = typeof identity.$inferInsert;

// import { Entity, ManyToOne, PrimaryGeneratedColumn, Column } from 'typeorm';
// import { User } from './User';

// @Entity()
// export class Identity {
// 	@PrimaryGeneratedColumn('uuid')
// 	id!: string;

// 	@Column('text')
// 	provider_type!: 'twitch' | 'steam' | 'local' | 'discord';

// 	/**
// 	 * Hashed password for local, auth token from twitch, etc.
// 	 */
// 	@Column('text')
// 	provider_hash!: string;

// 	/**
// 	 * Only used by Twitch and Discord providers.
// 	 */
// 	@Column('text', { nullable: true })
// 	provider_access_token: string | null = null;

// 	/**
// 	 * Only used by Twitch and Discord providers.
// 	 */
// 	@Column('text', { nullable: true })
// 	provider_refresh_token: string | null = null;

// 	@ManyToOne(() => User, (user) => user.identities)
// 	user!: User;
// }
