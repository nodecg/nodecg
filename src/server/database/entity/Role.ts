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

export type Role = typeof role.$inferSelect;

// WARNING: If you update this value, you need to make sure you create a new migration that uses these new values.
// Use `npx drizzle-kit generate --custom` to create a new custom migration. This will add a new file to `db/migrations`
// that you can edit. Then, write SQL to update the existing rows in the database to the new values by finding the rows
// using the previous values.
export const SUPERUSER_ROLE_ID = '07e18d80-fa74-4d98-ac18-838c745a480f';
