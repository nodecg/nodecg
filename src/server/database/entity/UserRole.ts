import { text, sqliteTable, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { role } from './Role';
import { user } from './User';

export const userRoles = sqliteTable('user_roles_role', {
	userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	roleId: text('roleId').notNull().references(() => role.id, { onDelete: 'cascade', onUpdate: 'cascade' })
}, table => {
	return {
		pk: primaryKey({ columns: [table.userId, table.roleId] })
	}
});

export const userRolesRelations = relations(userRoles, ({ one }) => {
	return {
		user: one(user, {
			fields: [userRoles.userId],
			references: [user.id]
		}),
		role: one(role, {
			fields: [userRoles.roleId],
			references: [role.id]
		})
	}
});
