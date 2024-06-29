/* eslint-disable @typescript-eslint/prefer-literal-enum-member */
import { integer, text, sqliteTable } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid"
import { role } from './Role';

export const permission = sqliteTable('permission', {
	id: text('id').$defaultFn(() => uuidv4()).primaryKey(),
	name: text('name').notNull(),
	roleId: text('roleId').references(() => role.id),
	entityId: text('entityId').notNull(),
	actions: integer('actions').notNull()
});

export const permissionRelations = relations(permission, ({ one }) => {
	return {
		role: one(role, {
			fields: [permission.roleId],
			references: [role.id]
		})
	}
});

export type Permission = typeof permission.$inferSelect;

// import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
// import { Role } from './Role';

export const enum Action {
	NONE = 0,
	READ = 1 << 0,
	WRITE = 1 << 1,
}

// @Entity()
// export class Permission {
// 	@PrimaryGeneratedColumn('uuid')
// 	id!: string;

// 	@Column('text')
// 	name!: string;

// 	@ManyToOne(() => Role, (role) => role.permissions)
// 	role!: Role;

// 	@Column('text')
// 	entityId!: string;

// 	@Column('int')
// 	actions!: number;
// }
