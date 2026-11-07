import { loadAuthClient, loadNamespace } from "@nodecg-next/client";
import { assert, describe, expect, onTestFinished, test } from "vitest";

import { makeAuthHelpers } from "../../src/client/auth.ts";
import { suiteBase } from "../../src/client/suite-base.ts";
import { fixtureManifest } from "../../src/shared/manifests.ts";

const base = suiteBase("auth");
const {
	createUser,
	grantAsAdmin,
	grantRole,
	login,
	logout,
	me,
	revokeAsAdmin,
} = makeAuthHelpers(base);

describe("anonymous identity", () => {
	test("a request without a session resolves to the anonymous identity", async () => {
		await logout();
		expect((await me()).identity).toEqual({ _tag: "anonymous" });
	});
});

describe("browser login", () => {
	test("logging in establishes a session, logout tears it down", async () => {
		await login("alice");

		expect((await me()).identity).toEqual({
			_tag: "user",
			id: expect.any(String),
			authentication: { issuer: "dev", subject: "alice" },
			displayName: "Alice",
			roles: [],
			globalRoles: [],
		});

		await logout();
		expect((await me()).identity).toEqual({ _tag: "anonymous" });
	});
});

describe("role reporting", () => {
	test("anonymous holds no declared role", async () => {
		await logout();
		expect((await me()).namespaces["e2e"]?.roles).toEqual([]);
	});

	test("a held declared role reports for its namespace, capabilities or not", async () => {
		const permsviewerUserId = await createUser("permsviewer");
		await grantAsAdmin(permsviewerUserId, {
			namespace: "e2e",
			name: "viewer",
		});
		await login("permsviewer");
		onTestFinished(async () => {
			await revokeAsAdmin(permsviewerUserId, {
				namespace: "e2e",
				name: "viewer",
			});
			await logout();
		});

		expect((await me()).namespaces["e2e"]?.roles).toEqual(["viewer"]);
	});
});

describe("loadAuthClient", () => {
	test("passes providers, me, and logout through to the live server", async () => {
		await logout();
		const client = loadAuthClient(base);
		onTestFinished(() => {
			client.dispose();
		});
		onTestFinished(async () => {
			await logout();
		});

		const providers = await client.providers();
		expect(providers.map(({ name, url }) => ({ name, url: url.href }))).toEqual(
			[{ name: "dev", url: `${base}/api/internal/authentication/login/dev` }],
		);

		await login("alice");
		const payload = await client.me();
		assert(payload.identity._tag === "user");
		expect(payload.namespaces["e2e"]?.roles).toEqual([]);

		await client.logout();
		expect((await me()).identity).toEqual({ _tag: "anonymous" });
	});
});

describe("loadNamespace", () => {
	test("passes me through to the live server", async () => {
		await login("alice");
		onTestFinished(async () => {
			await logout();
		});
		const root = await loadNamespace(fixtureManifest, { baseUrl: base });
		onTestFinished(() => {
			root.dispose();
		});

		const payload = await root.auth.me();
		expect(payload.identity).toMatchObject({
			_tag: "user",
			authentication: { issuer: "dev", subject: "alice" },
		});
	});
});

describe("runtime role assignment", () => {
	test("a granted role rides on the resolved identity live, and revoke removes it", async () => {
		const operatorUserId = await createUser("operator");
		await login("operator");
		const before = (await me()).identity;
		assert(before._tag === "user");
		expect(before.roles).toEqual([]);

		await grantAsAdmin(operatorUserId, {
			namespace: "e2e",
			name: "producer",
		});
		await login("operator");
		const granted = (await me()).identity;
		assert(granted._tag === "user");
		expect(granted.roles).toEqual([{ namespace: "e2e", name: "producer" }]);

		await revokeAsAdmin(operatorUserId, {
			namespace: "e2e",
			name: "producer",
		});
		await login("operator");
		const revoked = (await me()).identity;
		assert(revoked._tag === "user");
		expect(revoked.roles).toEqual([]);

		await logout();
	});

	test("even an admin cannot grant an undeclarable role", async () => {
		const operatorUserId = await createUser("operator");
		await login("root");
		onTestFinished(async () => {
			await logout();
		});
		await expect(
			grantRole(operatorUserId, { namespace: "e2e", name: "server" }),
		).rejects.toThrow("Authentication request failed");
		await expect(
			grantRole(operatorUserId, { namespace: "e2e", name: "superadmin" }),
		).rejects.toThrow("Authentication request failed");
	});

	test("an admin cannot grant a role to an unknown account", async () => {
		await login("root");
		onTestFinished(async () => {
			await logout();
		});
		await expect(
			grantRole("unknown-user", {
				namespace: "e2e",
				name: "viewer",
			}),
		).rejects.toMatchObject({
			_tag: "AuthRequestFailed",
			cause: { _tag: "NotFound" },
		});
	});

	test("a caller without the admin tier cannot grant", async () => {
		await login("nobody");
		onTestFinished(async () => {
			await logout();
		});
		await expect(
			grantRole("unknown-user", {
				namespace: "e2e",
				name: "producer",
			}),
		).rejects.toMatchObject({
			_tag: "AuthRequestFailed",
			cause: { _tag: "Forbidden" },
		});
	});

	test("an anonymous caller cannot grant", async () => {
		await logout();
		await expect(
			grantRole("unknown-user", {
				namespace: "e2e",
				name: "producer",
			}),
		).rejects.toMatchObject({
			_tag: "AuthRequestFailed",
			cause: { _tag: "Unauthorized" },
		});
	});
});
