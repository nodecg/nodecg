import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import {
	Authentication,
	Role,
	RoleNameSchema,
	ServiceAccountId,
	User,
	UserId,
} from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { Effect, HashMap, HashSet, Layer, Option } from "effect";
import { afterEach, assert, describe, expect, vi } from "vitest";

import { ConfiguredSuperadmins } from "../configured-superadmins.ts";
import {
	type ServiceAccountRepository,
	ServiceAccountRepositoryService,
} from "../services/repository/service-account/service-account-repository.ts";
import {
	type SessionRepository,
	SessionRepositoryService,
} from "../services/repository/session/session-repository.ts";
import {
	resolveServiceAccountCaller,
	resolveSessionCaller,
} from "./identity.ts";
import { RoleLinks } from "./role-links.ts";
import { hashSessionToken } from "./session.ts";

const alice = Authentication.make({ issuer: "dev", subject: "alice" });
const aliceSecondAuthentication = Authentication.make({
	issuer: "twitch",
	subject: "alice",
});
const root = Authentication.make({ issuer: "dev", subject: "root" });
const viewer = Role.make({
	namespace: "show",
	name: RoleNameSchema.make("viewer"),
});
const uploader = Role.make({
	namespace: "show-assets",
	name: RoleNameSchema.make("uploader"),
});

const aliceUser = {
	id: UserId.make("alice-user"),
	displayName: "Alice",
	authentications: [alice],
	roles: [viewer],
	globalRoles: ["admin" as const],
};

const resolve = vi.fn<SessionRepository["resolve"]>(() => Effect.succeedNone);
const resolveByKeyHash = vi.fn<ServiceAccountRepository["resolveByKeyHash"]>(
	() => Effect.succeedNone,
);

afterEach(() => {
	resolve.mockReset();
	resolveByKeyHash.mockReset();
});

const test = testLayer(
	Layer.mergeAll(
		Layer.mock(SessionRepositoryService)({ resolve }),
		Layer.succeed(ConfiguredSuperadmins, [root, aliceSecondAuthentication]),
		NodeCrypto.layer,
		Layer.mock(ServiceAccountRepositoryService)({ resolveByKeyHash }),
		Layer.succeed(RoleLinks, HashMap.empty()),
	),
);

const linkViewerToUploader = Effect.provideService(
	RoleLinks,
	HashMap.make([viewer, HashSet.make(uploader)]),
);

describe("resolveSessionCaller", () => {
	test(
		"resolves the session to its user, with the roles of its account",
		Effect.gen(function* () {
			resolve.mockReturnValueOnce(
				Effect.succeedSome({ authentication: alice, user: aliceUser }),
			);

			const caller = yield* resolveSessionCaller("token");

			expect(caller).toStrictEqual(
				Option.some(
					User.make({
						id: UserId.make("alice-user"),
						authentication: alice,
						displayName: "Alice",
						roles: [viewer],
						globalRoles: ["admin"],
					}),
				),
			);
		}),
	);

	test(
		"adds superadmin when any of the user's authentications is in config",
		Effect.gen(function* () {
			resolve.mockReturnValueOnce(
				Effect.succeedSome({
					authentication: alice,
					user: {
						...aliceUser,
						authentications: [alice, aliceSecondAuthentication],
					},
				}),
			);

			const caller = yield* resolveSessionCaller("token");

			expect(caller).toStrictEqual(
				Option.some(
					User.make({
						id: UserId.make("alice-user"),
						authentication: alice,
						displayName: "Alice",
						roles: [viewer],
						globalRoles: ["admin", "superadmin"],
					}),
				),
			);
		}),
	);

	test(
		"adds linked roles",
		Effect.gen(function* () {
			resolve.mockReturnValueOnce(
				Effect.succeedSome({ authentication: alice, user: aliceUser }),
			);

			const caller =
				yield* resolveSessionCaller("token").pipe(linkViewerToUploader);

			assert(Option.isSome(caller));
			assert.sameDeepMembers([...caller.value.roles], [viewer, uploader]);
		}),
	);

	test(
		"looks the session up by the token's hash",
		Effect.gen(function* () {
			yield* resolveSessionCaller("token");

			const id = yield* hashSessionToken("token");
			expect(resolve).toHaveBeenCalledExactlyOnceWith(id);
		}),
	);

	test(
		"resolves nothing without a live session",
		Effect.gen(function* () {
			const caller = yield* resolveSessionCaller("token");

			expect(caller).toStrictEqual(Option.none());
		}),
	);

	test(
		"resolves nothing for an empty token without a lookup",
		Effect.gen(function* () {
			const caller = yield* resolveSessionCaller("");

			expect(caller).toStrictEqual(Option.none());
			expect(resolve).not.toHaveBeenCalled();
		}),
	);
});

describe("resolveServiceAccountCaller", () => {
	test(
		"resolves nothing for an empty token without a lookup",
		Effect.gen(function* () {
			const caller = yield* resolveServiceAccountCaller("");

			expect(caller).toStrictEqual(Option.none());
			expect(resolveByKeyHash).not.toHaveBeenCalled();
		}),
	);

	test(
		"adds linked roles",
		Effect.gen(function* () {
			resolveByKeyHash.mockReturnValueOnce(
				Effect.succeedSome({
					id: ServiceAccountId.make("00000000-0000-4000-8000-000000000001"),
					displayName: "Encoder",
					roles: [viewer],
					globalRoles: [],
				}),
			);

			const caller =
				yield* resolveServiceAccountCaller("key").pipe(linkViewerToUploader);

			assert(Option.isSome(caller));
			assert.sameDeepMembers([...caller.value.roles], [viewer, uploader]);
		}),
	);
});
