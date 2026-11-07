import { UserId } from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { Effect, Layer } from "effect";
import { afterEach, describe, expect, vi } from "vitest";

import { ConfiguredSuperadmins } from "../configured-superadmins.ts";
import {
	type AuthenticationRepository,
	AuthenticationRepositoryService,
} from "../services/repository/authentication/authentication-repository.ts";
import {
	type UserRepository,
	UserRepositoryService,
} from "../services/repository/user/user-repository.ts";
import { revokeGlobalRole, SuperadminInConfig } from "./users.ts";

const alice = { issuer: "dev", subject: "alice" };
const root = { issuer: "dev", subject: "root" };
const userId = UserId.make("some-user");

const resolveByUserId = vi.fn<AuthenticationRepository["resolveByUserId"]>(() =>
	Effect.succeed([]),
);
const deleteGlobalRole = vi.fn<UserRepository["revokeGlobalRole"]>(
	() => Effect.void,
);

afterEach(() => {
	for (const mock of [resolveByUserId, deleteGlobalRole]) {
		mock.mockReset();
	}
});

const test = testLayer(
	Layer.mergeAll(
		Layer.mock(AuthenticationRepositoryService)({ resolveByUserId }),
		Layer.mock(UserRepositoryService)({ revokeGlobalRole: deleteGlobalRole }),
		Layer.succeed(ConfiguredSuperadmins, [root]),
	),
);

describe("revokeGlobalRole", () => {
	test(
		"refuses to revoke a superadmin from config",
		Effect.gen(function* () {
			resolveByUserId.mockReturnValue(Effect.succeed([root]));

			const error = yield* revokeGlobalRole(userId, "superadmin").pipe(
				Effect.flip,
			);
			expect(error).toStrictEqual(
				SuperadminInConfig.make({ userId, authentication: root }),
			);

			yield* revokeGlobalRole(userId, "admin");
			expect(deleteGlobalRole).toHaveBeenCalledExactlyOnceWith(userId, "admin");
		}),
	);

	test(
		"revokes a superadmin not from config",
		Effect.gen(function* () {
			resolveByUserId.mockReturnValue(Effect.succeed([alice]));

			yield* revokeGlobalRole(userId, "superadmin");
			expect(resolveByUserId).toHaveBeenCalledExactlyOnceWith(userId);
			expect(deleteGlobalRole).toHaveBeenCalledExactlyOnceWith(
				userId,
				"superadmin",
			);
		}),
	);
});
