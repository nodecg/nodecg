import { testLayer } from "@nodecg-next/test-utils";
import { Effect, Layer } from "effect";
import { afterEach, describe, expect, vi } from "vitest";

import { ConfiguredSuperadmins } from "../configured-superadmins.ts";
import {
	type RoleRepository,
	RoleRepositoryService,
} from "../services/repository/role/role-repository.ts";
import { superadminExists } from "./roles.ts";

const root = { issuer: "dev", subject: "root" };

const globalRoleExists = vi.fn<RoleRepository["globalRoleExists"]>(() =>
	Effect.succeed(false),
);

afterEach(() => {
	globalRoleExists.mockReset();
});

const test = testLayer(
	Layer.mergeAll(
		Layer.mock(RoleRepositoryService)({ globalRoleExists }),
		Layer.succeed(ConfiguredSuperadmins, [root]),
	),
);

describe("superadminExists", () => {
	test(
		"reports a superadmin in config without reading the repository",
		Effect.gen(function* () {
			expect(yield* superadminExists()).toBe(true);
			expect(globalRoleExists).not.toHaveBeenCalled();
		}),
	);

	test(
		"asks the repository for a superadmin grant when none is in config",
		Effect.gen(function* () {
			globalRoleExists.mockReturnValueOnce(Effect.succeed(true));
			expect(
				yield* superadminExists().pipe(
					Effect.provideService(ConfiguredSuperadmins, []),
				),
			).toBe(true);
			expect(globalRoleExists).toHaveBeenCalledExactlyOnceWith("superadmin");
		}),
	);
});
