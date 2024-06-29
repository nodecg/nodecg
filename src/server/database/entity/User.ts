import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { userRoles } from './UserRole';
import { identity } from './Identity';
import { apiKey } from './ApiKey';

export const user = sqliteTable('user', {
	id: text('id').$defaultFn(() => uuidv4()).primaryKey(),
	created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
	name: text('name').notNull()
});

export const userRelations = relations(user, ({ many }) => {
	return {
		apiKeys: many(apiKey),
		roles: many(userRoles),
		identities: many(identity)
	};
});

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Role } from './Role';
import { Identity } from './Identity';
import { ApiKey } from './ApiKey';

@Entity()
export class User {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@CreateDateColumn()
	created_at!: number;

	@Column('text')
	name!: string;

	@ManyToMany(() => Role)
	@JoinTable()
	roles!: Role[];

	@OneToMany(() => Identity, (identity) => identity.user)
	identities!: Identity[];

	@OneToMany(() => ApiKey, (apiKey) => apiKey.user)
	apiKeys!: ApiKey[];
}
