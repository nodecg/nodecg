import type {
	Authentication,
	AuthenticationId,
	UserId,
} from "@nodecg-next/internal";
import { Context, type Effect } from "effect";

import type { BackendError } from "../repository-errors.ts";

export interface AuthenticationRepository {
	readonly findOrCreateAuthentication: (
		authentication: Authentication,
		displayName: string,
	) => Effect.Effect<
		{
			readonly authenticationId: AuthenticationId;
			readonly userId: UserId;
		},
		BackendError
	>;

	readonly resolveByUserId: (
		userId: UserId,
	) => Effect.Effect<ReadonlyArray<Authentication>, BackendError>;
}

export class AuthenticationRepositoryService extends Context.Service<
	AuthenticationRepositoryService,
	AuthenticationRepository
>()("AuthenticationRepository") {}
