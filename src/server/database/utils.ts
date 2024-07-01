import { eq, and } from 'drizzle-orm';
import { getConnection, user, apiKey, role, User, Role, Identity, identity, userRoles } from '../database';
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
	const insertedIdentity = (await database.insert(identity)
		.values({
			provider_type,
			provider_hash,
			provider_access_token: provider_access_token ?? null,
			provider_refresh_token: provider_refresh_token ?? null,
		})
		.onConflictDoUpdate({
			target: [identity.provider_type, identity.provider_hash],
			set: {
				provider_access_token: provider_access_token ?? null,
				provider_refresh_token: provider_refresh_token ?? null
			}
		})
		.returning())[0];
	if (!insertedIdentity) {
		throw new Error('No identity returned when inserting');
	}

	// TODO: Rename `placeholder`. This is like this because I can't call this `user`, since that conflicts with the name of the table. I may have to restructure some things so that tables live in their own object and aren't top level variables.
	let placeholder: User | undefined = undefined;

	// If we have a user associated with this identity, fetch it. If we don't, then create a new user.
	const userId = insertedIdentity.userId;
	if (!userId) {
		placeholder = (await database.insert(user).values({ name: name }).returning())[0];
		if (!placeholder) {
			throw new Error('No user returned while inserting');
		}

		await database.update(identity)
			.set({ userId: placeholder.id })
			.where(eq(identity.id, insertedIdentity.id))

		await createApiKeyForUserWithId(placeholder.id);
	} else {
		placeholder = await findUserById(userId);
	}

	if (!placeholder) {
		// Something went very wrong.
		throw new Error('Failed to find user after upserting.');
	}

	// Update the user with the given roles by first removing all the roles they currently have, and inserting new roles for the user.
	await database.transaction(async (tx) => {
		await tx.delete(userRoles).where(eq(userRoles.userId, placeholder!.id));

		if (roles.length > 0) {
			await tx.insert(userRoles).values(
				roles.map(role => ({ roleId: role.id, userId: placeholder!.id }))
			)
		}
	});

	return placeholder;
}

export async function isSuperUser(user: User): Promise<boolean> {
	return isUserIdSuperUser(user.id);
}

export async function isUserIdSuperUser(userId: User['id']): Promise<boolean> {
	const database = await getConnection();
	return await database.query.userRoles.findFirst({
		where: and(
			eq(userRoles.userId, userId),
			eq(userRoles.roleId, SUPERUSER_ROLE_ID)
		)
	}) != undefined;
}

async function findRole(name: Role['name']): Promise<Role | undefined> {
	const database = await getConnection();
	return database.query.role.findFirst({
		where: eq(role.name, name),
		with: {
			permissions: true
		}
	});
}

export async function createApiKeyForUserWithId(userId: User['id']): Promise<ApiKey> {
	const database = await getConnection();
	const result = (await database.insert(apiKey).values({ userId }).returning())[0];
	if (!result) {
		throw new Error('No API Key returned when inserting.');
	}
	return result;
}

async function findUserById(userId: User['id']): Promise<User | undefined> {
	const database = await getConnection();
	return database.query.user.findFirst({
		where: eq(user.id, userId)
	});
}
