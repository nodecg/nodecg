"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseAdapter = exports.User = exports.Role = exports.Replicant = exports.Identity = exports.getConnection = exports.ApiKey = void 0;
const connection_1 = require("./connection");
Object.defineProperty(exports, "ApiKey", { enumerable: true, get: function () { return connection_1.ApiKey; } });
Object.defineProperty(exports, "getConnection", { enumerable: true, get: function () { return connection_1.getConnection; } });
Object.defineProperty(exports, "Identity", { enumerable: true, get: function () { return connection_1.Identity; } });
Object.defineProperty(exports, "Replicant", { enumerable: true, get: function () { return connection_1.Replicant; } });
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return connection_1.Role; } });
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return connection_1.User; } });
async function findUser(id) {
    const database = await (0, connection_1.getConnection)();
    return database.getRepository(connection_1.User).findOne({
        where: { id },
        relations: ["roles", "identities", "apiKeys"],
        cache: true,
    });
}
async function getSuperUserRole() {
    const superUserRole = await findRole("superuser");
    if (!superUserRole) {
        throw new Error("superuser role unexpectedly not found");
    }
    return superUserRole;
}
async function upsertUser({ name, provider_type, provider_hash, provider_access_token, provider_refresh_token, roles, }) {
    const database = await (0, connection_1.getConnection)();
    const { manager } = database;
    let user = null;
    // Check for ident that matches.
    // If found, it should have an associated user, so return that.
    // Else, make an ident and user.
    const existingIdent = await findIdent(provider_type, provider_hash);
    if (existingIdent) {
        existingIdent.provider_access_token = provider_access_token ?? null;
        existingIdent.provider_refresh_token = provider_refresh_token ?? null;
        await manager.save(existingIdent);
        user = await findUserById(existingIdent.user.id);
    }
    else {
        const ident = await createIdentity({
            provider_type,
            provider_hash,
            provider_access_token: provider_access_token ?? null,
            provider_refresh_token: provider_refresh_token ?? null,
        });
        const apiKey = await createApiKey();
        user = manager.create(connection_1.User, {
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
function isSuperUser(user) {
    return Boolean(user.roles?.find((role) => role.name === "superuser"));
}
async function findRole(name) {
    const database = await (0, connection_1.getConnection)();
    const { manager } = database;
    return manager.findOne(connection_1.Role, { where: { name }, relations: ["permissions"] });
}
async function createIdentity(identInfo) {
    const database = await (0, connection_1.getConnection)();
    const { manager } = database;
    const ident = manager.create(connection_1.Identity, identInfo);
    return manager.save(ident);
}
async function createApiKey() {
    const database = await (0, connection_1.getConnection)();
    const { manager } = database;
    const apiKey = manager.create(connection_1.ApiKey);
    await manager.save(apiKey);
    return apiKey;
}
async function findIdent(type, hash) {
    const database = await (0, connection_1.getConnection)();
    return database.getRepository(connection_1.Identity).findOne({
        where: { provider_hash: hash, provider_type: type },
        relations: ["user"],
    });
}
async function findUserById(userId) {
    const database = await (0, connection_1.getConnection)();
    return database.getRepository(connection_1.User).findOne({
        where: {
            id: userId,
        },
        relations: ["roles", "identities", "apiKeys"],
    });
}
async function findApiKey(token) {
    const database = await (0, connection_1.getConnection)();
    return database.getRepository(connection_1.ApiKey).findOne({
        where: { secret_key: token },
        relations: ["user"],
    });
}
async function saveUser(user) {
    const database = await (0, connection_1.getConnection)();
    await database.manager.save(user);
}
async function deleteSecretKey(token) {
    const database = await (0, connection_1.getConnection)();
    await database.manager.delete(connection_1.ApiKey, { secret_key: token });
}
const repEntities = [];
async function saveReplicant(replicant) {
    let valueChangedDuringSave = false;
    const connection = await (0, connection_1.getConnection)();
    const manager = connection.manager;
    let repEnt;
    const existingEnt = repEntities.find((pv) => pv.namespace === replicant.namespace && pv.name === replicant.name);
    if (existingEnt) {
        repEnt = existingEnt;
    }
    else {
        repEnt = manager.create(connection_1.Replicant, {
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
    const changeHandler = (newVal) => {
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
    }
    finally {
        replicant.off("change", changeHandler);
    }
}
async function getAllReplicants() {
    const connection = await (0, connection_1.getConnection)();
    return connection.getRepository(connection_1.Replicant).find();
}
exports.databaseAdapter = {
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
//# sourceMappingURL=database-adapter.js.map