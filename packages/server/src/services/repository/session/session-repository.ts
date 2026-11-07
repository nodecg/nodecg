import type {
	Authentication,
	AuthenticationId,
	GlobalRoleName,
	Role,
	UserId,
	UserSessionId,
} from "@nodecg-next/internal";
import { Context, type Effect, type Option } from "effect";
import type { DateTime } from "effect";

import type { BackendError, KeyTaken } from "../repository-errors.ts";

export interface SessionRepository {
	readonly create: (
		id: UserSessionId,
		authenticationId: AuthenticationId,
		expiresAt: DateTime.DateTime,
	) => Effect.Effect<void, KeyTaken | BackendError>;

	readonly resolve: (id: UserSessionId) => Effect.Effect<
		Option.Option<{
			readonly authentication: Authentication;
			readonly user: {
				readonly id: UserId;
				readonly displayName: string;
				readonly authentications: ReadonlyArray<Authentication>;
				readonly roles: ReadonlyArray<Role>;
				readonly globalRoles: ReadonlyArray<GlobalRoleName>;
			};
		}>,
		BackendError
	>;

	readonly refreshTTL: (
		id: UserSessionId,
		expiresAt: DateTime.DateTime,
		ifExpiresBefore: DateTime.DateTime,
	) => Effect.Effect<boolean, BackendError>;

	readonly revoke: (id: UserSessionId) => Effect.Effect<void, BackendError>;
}

export class SessionRepositoryService extends Context.Service<
	SessionRepositoryService,
	SessionRepository
>()("SessionRepository") {}
