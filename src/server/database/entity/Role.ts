import { text, sqliteTable } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { userRoles } from './UserRole';
import { permission } from './Permission';

export const role = sqliteTable("role", {
	id: text('id').$defaultFn(() => uuidv4()).primaryKey(),
	name: text('name').unique().notNull()
});

export const roleRelations = relations(role, ({ many }) => {
	return {
		permissions: many(permission),
		users: many(userRoles)
	}
});

// import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
// import { Permission } from './Permission';

// @Entity()
// export class Role {
// 	@PrimaryGeneratedColumn('uuid')
// 	id!: string;

// 	@Column({
// 		type: 'text',
// 		unique: true,
// 	})
// 	name!: string;

// 	@OneToMany(() => Permission, (permission) => permission.role)
// 	permissions!: Permission[];
// }
