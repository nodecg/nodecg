import { getConnection, User, Role, Identity } from '../database';
import { ApiKey } from './entity/ApiKey';

export async function findUser(id: User['id']): Promise<User | undefined> {
	const database = await getConnection();
	return database.getRepository(User).findOne(id, { relations: ['roles', 'identities', 'apiKeys'], cache: true });
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
	roles,
}: {
	name: User['name'];
	provider_type: Identity['provider_type'];
	provider_hash: Identity['provider_hash'];
	roles: User['roles'];
}): Promise<User> {
	const database = await getConnection();
	const { manager } = database;
	let user: User;

	// Check for ident that matches.
	// If found, it should have an associated user, so return that.
	// Else, make an ident and user.
	const existingIdent = await findIdent(provider_type, provider_hash);
	if (existingIdent) {
		user = existingIdent.user;
	} else {
		const ident = await createIdentity({
			provider_type,
			provider_hash,
		});
		const apiKey = await createApiKey();
		user = manager.create(User, {
			name,
			identities: [ident],
			apiKeys: [apiKey],
		});
	}

	// Always update the roles, regardless of if we are making a new user or updating an existing one.
	user.roles = roles;
	return manager.save(user);
}

export function isSuperUser(user: User): boolean {
	return Boolean(user.roles?.find((role) => role.name === 'superuser'));
}

async function findRole(name: Role['name']): Promise<Role | undefined> {
	const database = await getConnection();
	const { manager } = database;
	return manager.findOne(
		Role,
		{
			name,
		},
		{ relations: ['permissions'] },
	);
}

async function createIdentity(identInfo: Pick<Identity, 'provider_type' | 'provider_hash'>): Promise<Identity> {
	const database = await getConnection();
	const { manager } = database;
	const ident = manager.create(Identity, identInfo);
	return manager.save(ident);
}

async function createApiKey(): Promise<ApiKey> {
	const database = await getConnection();
	const { manager } = database;
	const apiKey = manager.create(ApiKey);
	return manager.save(apiKey);
}

async function findIdent(
	type: Identity['provider_type'],
	hash: Identity['provider_hash'],
): Promise<Identity | undefined> {
	const database = await getConnection();
	return database.getRepository(Identity).findOne(
		{
			provider_hash: hash,
			provider_type: type,
		},
		{
			relations: ['user'],
		},
	);
}
