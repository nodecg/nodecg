import type { AuthClient, MePayload } from "@nodecg-next/client";
import { AnonymousIdentitySchema, User, UserId } from "@nodecg-next/internal";
import { describe, expect, test, vi } from "vitest";

import { authSession } from "./auth-session.ts";

const userIdentity = User.make({
	id: UserId.make("1"),
	authentication: { issuer: "dev", subject: "alice" },
	displayName: "Alice",
	roles: [],
	globalRoles: [],
});

const userPayload: MePayload = { identity: userIdentity, namespaces: {} };

const stubClient = () => {
	const providers = vi.fn<AuthClient["providers"]>(async () => []);
	const me = vi.fn<AuthClient["me"]>(async () => userPayload);
	const logout = vi.fn<AuthClient["logout"]>(async () => undefined);
	const listUsers = vi.fn<AuthClient["listUsers"]>(async () => ({ users: [] }));
	const grantRole = vi.fn<AuthClient["grantRole"]>(async () => {});
	const revokeRole = vi.fn<AuthClient["revokeRole"]>(async () => {});
	const dispose = vi.fn();
	const client: AuthClient = {
		providers,
		me,
		logout,
		listUsers,
		grantRole,
		revokeRole,
		dispose,
	};
	return { client, me, logout };
};

describe("identity", () => {
	test("starts unloaded and is seeded by the boot-time refresh", async () => {
		const { client } = stubClient();
		const session = authSession(client);
		expect(session.identity.get()).toBeUndefined();
		await vi.waitFor(() => {
			expect(session.identity.get()).toEqual(userIdentity);
		});
	});

	test("subscribe notifies on change until unsubscribed", async () => {
		const { client } = stubClient();
		const session = authSession(client);
		const changed = vi.fn();
		const unsubscribe = session.identity.subscribe(changed);

		await session.refresh();
		expect(changed).toHaveBeenCalled();

		unsubscribe();
		const calls = changed.mock.calls.length;
		await session.refresh();
		expect(changed.mock.calls.length).toBe(calls);
	});
});

describe("refresh", () => {
	test("returns the payload and reflects its identity into the store", async () => {
		const { client, me } = stubClient();
		const session = authSession(client);

		const payload = await session.refresh();

		expect(payload).toEqual(userPayload);
		expect(session.identity.get()).toEqual(userIdentity);
		expect(me).toHaveBeenCalled();
	});
});

describe("logout", () => {
	test("calls the client and sets the store to the anonymous identity", async () => {
		const { client, logout } = stubClient();
		const session = authSession(client);

		await session.logout();

		expect(logout).toHaveBeenCalled();
		expect(session.identity.get()).toEqual(AnonymousIdentitySchema.make({}));
	});
});
