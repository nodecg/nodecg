import { Effect } from "effect";

import { ConfiguredSuperadmins } from "../configured-superadmins.ts";
import { RoleRepositoryService } from "../services/repository/role/role-repository.ts";

export const superadminExists = Effect.fn("superadminExists")(function* () {
	const superadmins = yield* ConfiguredSuperadmins;
	if (superadmins.length > 0) {
		return true;
	}
	const roleRepository = yield* RoleRepositoryService;
	return yield* roleRepository.globalRoleExists("superadmin");
});
