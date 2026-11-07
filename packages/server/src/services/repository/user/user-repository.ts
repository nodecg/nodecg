import {
	type Authentication,
	type GlobalRoleName,
	type Role,
	UserId,
} from "@nodecg-next/internal";
import { Context, type Effect, type HashSet, Schema } from "effect";

import type { BackendError } from "../repository-errors.ts";

export class UnknownUser extends Schema.TaggedError<UnknownUser>()(
	"UnknownUser",
	{ userId: UserId },
) {
	override readonly message = `No user has the id "${this.userId}"`;
}

export interface UserRepository {
	readonly listAll: () => Effect.Effect<
		ReadonlyArray<{
			readonly id: UserId;
			readonly displayName: string;
			readonly authentications: ReadonlyArray<Authentication>;
			readonly roles: ReadonlyArray<Role>;
			readonly globalRoles: ReadonlyArray<GlobalRoleName>;
		}>,
		BackendError
	>;

	readonly grantRoles: (
		id: UserId,
		roles: HashSet.HashSet<Role>,
	) => Effect.Effect<void, BackendError | UnknownUser>;

	readonly revokeRoles: (
		id: UserId,
		roles: HashSet.HashSet<Role>,
	) => Effect.Effect<void, BackendError | UnknownUser>;

	readonly grantGlobalRole: (
		id: UserId,
		role: GlobalRoleName,
	) => Effect.Effect<void, BackendError | UnknownUser>;

	readonly revokeGlobalRole: (
		id: UserId,
		role: GlobalRoleName,
	) => Effect.Effect<void, BackendError | UnknownUser>;
}

export class UserRepositoryService extends Context.Service<
	UserRepositoryService,
	UserRepository
>()("UserRepository") {}
