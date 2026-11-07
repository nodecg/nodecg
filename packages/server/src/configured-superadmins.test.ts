import { testLayer } from "@nodecg-next/test-utils";
import { Cause, ConfigProvider, Effect, Exit, HashMap, Layer } from "effect";
import { assert, describe, expect } from "vitest";

import {
	type AuthProvider,
	AuthProviderRegistry,
} from "./auth/auth-provider.ts";
import {
	ConfiguredSuperadmins,
	UnknownSuperadminProvider,
} from "./configured-superadmins.ts";

const dev: AuthProvider = {
	name: "dev",
	issuer: "https://idp.test",
	authorize: () => Effect.die("unused"),
	callback: () => Effect.die("unused"),
};

const test = testLayer(
	Layer.succeed(AuthProviderRegistry, HashMap.make(["dev", dev] as const)),
);

describe("ConfiguredSuperadmins", () => {
	test(
		"names each SUPERADMINS entry by its provider's issuer",
		Effect.gen(function* () {
			expect(
				yield* ConfiguredSuperadmins.make.pipe(
					Effect.provideService(
						ConfigProvider.ConfigProvider,
						ConfigProvider.fromEnvRecord({
							SUPERADMINS: "dev:root, dev:backup",
						}),
					),
				),
			).toStrictEqual([
				{ issuer: "https://idp.test", subject: "root" },
				{ issuer: "https://idp.test", subject: "backup" },
			]);
		}),
	);

	test(
		"is empty when SUPERADMINS is unset",
		Effect.gen(function* () {
			expect(
				yield* ConfiguredSuperadmins.make.pipe(
					Effect.provideService(
						ConfigProvider.ConfigProvider,
						ConfigProvider.fromEnvRecord({}),
					),
				),
			).toStrictEqual([]);
		}),
	);

	test(
		"is empty when SUPERADMINS is an empty string",
		Effect.gen(function* () {
			expect(
				yield* ConfiguredSuperadmins.make.pipe(
					Effect.provideService(
						ConfigProvider.ConfigProvider,
						ConfigProvider.fromEnvRecord({ SUPERADMINS: "" }),
					),
				),
			).toStrictEqual([]);
		}),
	);

	test(
		"fails when an entry names an unknown provider",
		Effect.gen(function* () {
			const error = yield* ConfiguredSuperadmins.make.pipe(
				Effect.provideService(
					ConfigProvider.ConfigProvider,
					ConfigProvider.fromEnvRecord({ SUPERADMINS: "ghost:root" }),
				),
				Effect.flip,
			);
			expect(error).toStrictEqual(
				UnknownSuperadminProvider.make({ provider: "ghost", subject: "root" }),
			);
		}),
	);

	test(
		"fails config parsing when an entry is not of the form <provider>:<subject>",
		Effect.gen(function* () {
			const exit = yield* ConfiguredSuperadmins.make.pipe(
				Effect.provideService(
					ConfigProvider.ConfigProvider,
					ConfigProvider.fromEnvRecord({ SUPERADMINS: "rootonly" }),
				),
				Effect.exit,
			);
			assert(Exit.isFailure(exit));
			const pretty = Cause.pretty(exit.cause);
			expect(pretty).toContain('["SUPERADMINS"]');
			expect(pretty).toContain(
				"Expected a string matching template literal parts",
			);
		}),
	);
});
