import {
	type GlobalRoleName,
	type Role,
	ServiceAccountId,
	type UserId,
} from "@nodecg-next/internal";
import {
	Context,
	type Effect,
	type HashSet,
	type Option,
	Schema,
} from "effect";

import type { BackendError } from "../repository-errors.ts";

export class UnknownServiceAccount extends Schema.TaggedError<UnknownServiceAccount>()(
	"UnknownServiceAccount",
	{ serviceAccountId: ServiceAccountId },
) {
	override readonly message = `No service account has the id "${this.serviceAccountId}"`;
}

export interface NewApiKey {
	readonly hash: string;
	readonly label: string;
}

export interface ServiceAccountRepository {
	readonly create: (input: {
		readonly displayName: string;
		readonly createdBy: UserId;
	}) => Effect.Effect<ServiceAccountId, BackendError>;

	readonly createWithId: (input: {
		readonly id: ServiceAccountId;
		readonly displayName: string;
		readonly createdBy: UserId;
	}) => Effect.Effect<void, BackendError>;

	readonly resolveById: (id: ServiceAccountId) => Effect.Effect<
		Option.Option<{
			readonly id: ServiceAccountId;
			readonly displayName: string;
		}>,
		BackendError
	>;

	readonly resolveByKeyHash: (hash: string) => Effect.Effect<
		Option.Option<{
			readonly id: ServiceAccountId;
			readonly displayName: string;
			readonly roles: ReadonlyArray<Role>;
			readonly globalRoles: ReadonlyArray<GlobalRoleName>;
		}>,
		BackendError
	>;

	readonly listAll: () => Effect.Effect<
		ReadonlyArray<{
			readonly id: ServiceAccountId;
			readonly displayName: string;
			readonly roles: ReadonlyArray<Role>;
			readonly globalRoles: ReadonlyArray<GlobalRoleName>;
		}>,
		BackendError
	>;

	readonly addKey: (
		id: ServiceAccountId,
		key: NewApiKey,
	) => Effect.Effect<void, BackendError>;

	readonly replaceKey: (
		id: ServiceAccountId,
		key: NewApiKey,
	) => Effect.Effect<
		Option.Option<{
			readonly displayName: string;
		}>,
		BackendError
	>;

	readonly delete: (
		id: ServiceAccountId,
	) => Effect.Effect<boolean, BackendError>;

	readonly grantRoles: (
		id: ServiceAccountId,
		roles: HashSet.HashSet<Role>,
	) => Effect.Effect<void, BackendError | UnknownServiceAccount>;

	readonly revokeRoles: (
		id: ServiceAccountId,
		roles: HashSet.HashSet<Role>,
	) => Effect.Effect<void, BackendError | UnknownServiceAccount>;
}

export class ServiceAccountRepositoryService extends Context.Service<
	ServiceAccountRepositoryService,
	ServiceAccountRepository
>()("ServiceAccountRepository") {}
