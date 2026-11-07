import {
	Authentication,
	type GlobalRoleName,
	UserId,
} from "@nodecg-next/internal";
import { Array, Effect, Match, Option, Schema } from "effect";

import { ConfiguredSuperadmins } from "../configured-superadmins.ts";
import { AuthenticationRepositoryService } from "../services/repository/authentication/authentication-repository.ts";
import { UserRepositoryService } from "../services/repository/user/user-repository.ts";

export class SuperadminInConfig extends Schema.TaggedError<SuperadminInConfig>()(
	"SuperadminInConfig",
	{ userId: UserId, authentication: Authentication },
) {
	override readonly message = `Superadmin "${this.authentication.issuer}:${this.authentication.subject}" comes from NODECG_SUPERADMINS and can only be revoked by removing the entry there`;
}

const findConfiguredSuperadmin = Effect.fnUntraced(function* (userId: UserId) {
	const authentications = yield* AuthenticationRepositoryService;
	const superadmins = yield* ConfiguredSuperadmins;
	const held = yield* authentications.resolveByUserId(userId);
	return Array.head(Array.intersection(held, superadmins));
});

export const grantGlobalRole = Effect.fn("grantGlobalRole")(function* (
	userId: UserId,
	role: GlobalRoleName,
) {
	const users = yield* UserRepositoryService;
	yield* users.grantGlobalRole(userId, role);
});

export const revokeGlobalRole = Effect.fn("revokeGlobalRole")(function* (
	userId: UserId,
	role: GlobalRoleName,
) {
	const users = yield* UserRepositoryService;
	const authenticationInConfig = yield* Match.value(role).pipe(
		Match.when("superadmin", () => findConfiguredSuperadmin(userId)),
		Match.when("admin", () => Effect.succeedNone),
		Match.exhaustive,
	);
	if (Option.isSome(authenticationInConfig)) {
		return yield* SuperadminInConfig.make({
			userId,
			authentication: authenticationInConfig.value,
		});
	}
	yield* users.revokeGlobalRole(userId, role);
});
