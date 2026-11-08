import { Context, Effect, HashMap, Layer, Option, Schema } from "effect";

import { AuthProviderRegistry } from "./auth/auth-provider.ts";
import { config } from "./server-config.ts";

export class UnknownSuperadminProvider extends Schema.TaggedError<UnknownSuperadminProvider>()(
	"UnknownSuperadminProvider",
	{ provider: Schema.String, subject: Schema.String },
) {
	override readonly message = `Configured superadmin "${this.provider}:${this.subject}" names an unknown authentication provider`;
}

export class ConfiguredSuperadmins extends Context.Service<ConfiguredSuperadmins>()(
	"ConfiguredSuperadmins",
	{
		make: Effect.gen(function* () {
			const superadmins = yield* config.superadmins;
			if (Option.isNone(superadmins)) {
				return [];
			}
			const registry = yield* AuthProviderRegistry;
			return yield* Effect.forEach(superadmins.value, (entry) =>
				Effect.gen(function* () {
					const provider = HashMap.get(registry, entry.provider);
					if (Option.isNone(provider)) {
						return yield* UnknownSuperadminProvider.make({
							provider: entry.provider,
							subject: entry.subject,
						});
					}
					return { issuer: provider.value.issuer, subject: entry.subject };
				}),
			);
		}),
	},
) {
	static readonly layer = Layer.effect(this, this.make);
}
