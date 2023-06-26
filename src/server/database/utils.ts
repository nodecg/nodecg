import { getConnection, User, Role, Identity } from '../database';
import { ApiKey } from './entity/ApiKey';

export async function findUser(id: User['id']): Promise<User | null> {
	const database = await getConnection();
	return database
		.getRepository(User)
		.findOne({ where: { id }, relations: ['roles', 'identities', 'apiKeys'], cache: true });
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
	roles: User['roles'];
}): Promise<User> {
	const database = await getConnection();
	const { manager } = database;
	let user: User | null = null;

	// Check for ident that matches.
	// If found, it should have an associated user, so return that.
	// Else, make an ident and user.
	const existingIdent = await findIdent(provider_type, provider_hash);
	if (existingIdent) {
		existingIdent.provider_access_token = provider_access_token ?? null;
		existingIdent.provider_refresh_token = provider_refresh_token ?? null;
		await manager.save(existingIdent);
		user = await findUserById(existingIdent.user.id);
	} else {
		const ident = await createIdentity({
			provider_type,
			provider_hash,
			provider_access_token: provider_access_token ?? null,
			provider_refresh_token: provider_refresh_token ?? null,
		});
		const apiKey = await createApiKey();
		user = manager.create(User, {
			name,
			identities: [ident],
			apiKeys: [apiKey],
		});
	}

	if (!user) {
		// Something went very wrong.
		throw new Error('Failed to find user after upserting.');
	}

	// Always update the roles, regardless of if we are making a new user or updating an existing one.
	user.roles = roles;
	return manager.save(user);
}

export function isSuperUser(user: User): boolean {
	return Boolean(user.roles?.find((role) => role.name === 'superuser'));
}

async function findRole(name: Role['name']): Promise<Role | null> {
	const database = await getConnection();
	const { manager } = database;
	return manager.findOne(Role, { where: { name }, relations: ['permissions'] });
}

async function createIdentity(
	identInfo: Pick<Identity, 'provider_type' | 'provider_hash' | 'provider_access_token' | 'provider_refresh_token'>,
): Promise<Identity> {
	const database = await getConnection();
	const { manager } = database;
	// See https://github.com/typeorm/typeorm/issues/9070
	const ident = manager.create<Identity>(Identity, identInfo);
	return manager.save(ident);
}

async function createApiKey(): Promise<ApiKey> {
	const database = await getConnection();
	const { manager } = database;
	const apiKey = manager.create(ApiKey);
	return manager.save(apiKey);
}

async function findIdent(type: Identity['provider_type'], hash: Identity['provider_hash']): Promise<Identity | null> {
	const database = await getConnection();
	return database.getRepository(Identity).findOne({
		where: { provider_hash: hash, provider_type: type },
		relations: ['user'],
	});
}

async function findUserById(userId: User['id']): Promise<User | null> {
	const database = await getConnection();
	return database.getRepository(User).findOne({
		where: {
			id: userId,
		},
		relations: ['roles', 'identities', 'apiKeys'],
	});
}
