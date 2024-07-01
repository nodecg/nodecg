import { eq, and } from 'drizzle-orm';
import { getConnection, tables, User, Role, Identity } from '../database';
import { ApiKey } from './entity/ApiKey';
import { SUPERUSER_ROLE_ID } from './database';

export async function findUser(id: User['id'] | null): Promise<User | undefined> {
	if (!id) {
		return undefined;
	}

	return findUserById(id);
}

export async function getSuperUserRole(): Promise<Role> {
	const superUserRole = await findRole('superuser');
	if (!superUserRole) {
		throw new Error('superuser role unexpectedly not found');
	}

	return superUserRole;
}

export async function upsertUser({
	name,
	provider_type,
	provider_hash,
	provider_access_token,
	provider_refresh_token,
	roles,
}: {
	name: User['name'];
	provider_type: Identity['provider_type'];
	provider_hash: Identity['provider_hash'];
	provider_access_token?: Identity['provider_access_token'];
	provider_refresh_token?: Identity['provider_refresh_token'];
	roles: Role[];
}): Promise<User> {
	const database = await getConnection();

	// Attempt to insert a new identity, updating any identity that may already exist.
	const insertedIdentity = (await database.insert(tables.identity)
		.values({
			provider_type,
			provider_hash,
			provider_access_token: provider_access_token ?? null,
			provider_refresh_token: provider_refresh_token ?? null,
		})
		.onConflictDoUpdate({
			target: [tables.identity.provider_type, tables.identity.provider_hash],
			set: {
				provider_access_token: provider_access_token ?? null,
				provider_refresh_token: provider_refresh_token ?? null
			}
		})
		.returning())[0];
	if (!insertedIdentity) {
		throw new Error('No identity returned when inserting');
	}

	let user: User | undefined = undefined;

	// If we have a user associated with this identity, fetch it. If we don't, then create a new user.
	const userId = insertedIdentity.userId;
	if (!userId) {
		user = (await database.insert(tables.user).values({ name: name }).returning())[0];
		if (!user) {
			throw new Error('No user returned while inserting');
		}

		await database.update(tables.identity)
			.set({ userId: user.id })
			.where(eq(tables.identity.id, insertedIdentity.id))

		await createApiKeyForUserWithId(user.id);
	} else {
		user = await findUserById(userId);
	}

	if (!user) {
		// Something went very wrong.
		throw new Error('Failed to find user after upserting.');
	}

	// Update the user with the given roles by first removing all the roles they currently have, and inserting new roles for the user.
	await database.transaction(async (tx) => {
		await tx.delete(tables.userRoles).where(eq(tables.userRoles.userId, user!.id));

		if (roles.length > 0) {
			await tx.insert(tables.userRoles).values(
				roles.map(role => ({ roleId: role.id, userId: user!.id }))
			)
		}
	});

	return user;
}

export async function isSuperUser(user: User): Promise<boolean> {
	return isUserIdSuperUser(user.id);
}

export async function isUserIdSuperUser(userId: User['id']): Promise<boolean> {
	const database = await getConnection();
	return await database.query.userRoles.findFirst({
		where: and(
			eq(tables.userRoles.userId, userId),
			eq(tables.userRoles.roleId, SUPERUSER_ROLE_ID)
		)
	}) != undefined;
}

async function findRole(name: Role['name']): Promise<Role | undefined> {
	const database = await getConnection();
	return database.query.role.findFirst({
		where: eq(tables.role.name, name)
	});
}

export async function createApiKeyForUserWithId(userId: User['id']): Promise<ApiKey> {
	const database = await getConnection();
	const result = (await database.insert(tables.apiKey).values({ userId }).returning())[0];
	if (!result) {
		throw new Error('No API Key returned when inserting.');
	}
	return result;
}

async function findUserById(userId: User['id']): Promise<User | undefined> {
	const database = await getConnection();
	return database.query.user.findFirst({
		where: eq(tables.user.id, userId)
	});
}
