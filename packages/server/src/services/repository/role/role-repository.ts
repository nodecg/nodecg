import type {
	Authentication,
	GlobalRoleName,
	Role,
} from "@nodecg-next/internal";
import { Context, type Effect } from "effect";

import type { BackendError } from "../repository-errors.ts";

export interface RoleAssignment {
	readonly authentication: Authentication;
	readonly displayName: string;
	readonly roles: ReadonlyArray<Role>;
	readonly globalRoles: ReadonlyArray<GlobalRoleName>;
}

export interface RoleRepository {
	readonly listAll: () => Effect.Effect<
		ReadonlyArray<RoleAssignment>,
		BackendError
	>;

	readonly globalRoleExists: (
		role: GlobalRoleName,
	) => Effect.Effect<boolean, BackendError>;

	readonly revokeAllRoles: () => Effect.Effect<void, BackendError>;
}

export class RoleRepositoryService extends Context.Service<
	RoleRepositoryService,
	RoleRepository
>()("RoleRepository") {}
