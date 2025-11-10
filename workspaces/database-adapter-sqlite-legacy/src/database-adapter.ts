import "reflect-metadata";

import type { DatabaseAdapter } from "@nodecg/database-adapter-types";

import { getConnection } from "./connection.js";
import { ApiKey } from "./entity/ApiKey.js";
import { Identity } from "./entity/Identity.js";
import { Replicant } from "./entity/Replicant.js";
import { Role } from "./entity/Role.js";
import { User } from "./entity/User.js";

async function findUser(id: User["id"]): Promise<User | null> {
	const database = await getConnection();
	return database.getRepository(User).findOne({
		where: { id },
		relations: ["roles", "identities", "apiKeys"],
		cache: true,
	});
}

async function getSuperUserRole(): Promise<Role> {
	const superUserRole = await findRole("superuser");
	if (!superUserRole) {
		throw new Error("superuser role unexpectedly not found");
	}

	return superUserRole;
}

async function upsertUser({
	name,
	provider_type,
	provider_hash,
	provider_access_token,
	provider_refresh_token,
	roles,
}: {
	name: User["name"];
	provider_type: Identity["provider_type"];
	provider_hash: Identity["provider_hash"];
	provider_access_token?: Identity["provider_access_token"];
	provider_refresh_token?: Identity["provider_refresh_token"];
	roles: User["roles"];
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
		throw new Error("Failed to find user after upserting.");
	}

	// Always update the roles, regardless of if we are making a new user or updating an existing one.
	user.roles = roles;
	return manager.save(user);
}

function isSuperUser(user: User): boolean {
	return Boolean(user.roles?.find((role) => role.name === "superuser"));
}

async function findRole(name: Role["name"]): Promise<Role | null> {
	const database = await getConnection();
	const { manager } = database;
	return manager.findOne(Role, { where: { name }, relations: ["permissions"] });
}

async function createIdentity(
	identInfo: Pick<
		Identity,
		| "provider_type"
		| "provider_hash"
		| "provider_access_token"
		| "provider_refresh_token"
	>,
): Promise<Identity> {
	const database = await getConnection();
	const { manager } = database;
	const ident = manager.create(Identity, identInfo);
	return manager.save(ident);
}

async function createApiKey(): Promise<ApiKey> {
	const database = await getConnection();
	const { manager } = database;
	const apiKey = manager.create(ApiKey);
	await manager.save(apiKey);
	return apiKey;
}

async function findIdent(
	type: Identity["provider_type"],
	hash: Identity["provider_hash"],
): Promise<Identity | null> {
	const database = await getConnection();
	return database.getRepository(Identity).findOne({
		where: { provider_hash: hash, provider_type: type },
		relations: ["user"],
	});
}

async function findUserById(userId: User["id"]): Promise<User | null> {
	const database = await getConnection();
	return database.getRepository(User).findOne({
		where: {
			id: userId,
		},
		relations: ["roles", "identities", "apiKeys"],
	});
}

async function findApiKey(token: string) {
	const database = await getConnection();
	return database.getRepository(ApiKey).findOne({
		where: { secret_key: token },
		relations: ["user"],
	});
}

async function saveUser(user: User) {
	const database = await getConnection();
	await database.manager.save(user);
}

async function deleteSecretKey(token: string) {
	const database = await getConnection();
	await database.manager.delete(ApiKey, { secret_key: token });
}

const repEntities: Replicant[] = [];

async function saveReplicant(replicant: {
	namespace: string;
	name: string;
	value: any;
	on: (event: "change", handler: (newVal: unknown) => void) => void;
	off: (event: "change", handler: (newVal: unknown) => void) => void;
}) {
	let valueChangedDuringSave = false;

	const connection = await getConnection();
	const manager = connection.manager;

	let repEnt: Replicant;
	const existingEnt = repEntities.find(
		(pv) => pv.namespace === replicant.namespace && pv.name === replicant.name,
	);
	if (existingEnt) {
		repEnt = existingEnt;
	} else {
		repEnt = manager.create(Replicant, {
			namespace: replicant.namespace,
			name: replicant.name,
		});
		repEntities.push(repEnt);
	}

	const valueRef = replicant.value;
	let serializedValue = JSON.stringify(valueRef);
	if (typeof serializedValue === "undefined") {
		serializedValue = "";
	}

	const changeHandler = (newVal: unknown) => {
		if (newVal !== valueRef && !isNaN(valueRef)) {
			valueChangedDuringSave = true;
		}
	};

	repEnt.value = serializedValue;

	try {
		replicant.on("change", changeHandler);
		await manager.save(repEnt);
		if (!valueChangedDuringSave) {
			return;
		}

		// If we are here, then that means the value changed again during
		// the save operation, and so we have to do some recursion
		// to save it again.
		await saveReplicant(replicant);
	} finally {
		replicant.off("change", changeHandler);
	}
}

async function getAllReplicants() {
	const connection = await getConnection();
	return connection.getRepository(Replicant).find();
}

export const databaseAdapter: DatabaseAdapter = {
	findUser,
	getSuperUserRole,
	upsertUser,
	isSuperUser,
	createApiKey,
	findApiKey,
	saveUser,
	deleteSecretKey,
	saveReplicant,
	getAllReplicants,
};
