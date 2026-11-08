import { Context, Effect, Layer, Match, Schema } from "effect";

export class UnsupportedOperatingSystem extends Schema.TaggedError<UnsupportedOperatingSystem>()(
	"UnsupportedOperatingSystem",
	{ platform: Schema.String },
) {
	override readonly message = `Unsupported operating system: ${this.platform}`;
}

export class OperatingSystemService extends Context.Service<OperatingSystemService>()(
	"OperatingSystem",
	{
		make: Effect.suspend(() =>
			Match.value(process.platform).pipe(
				Match.when("win32", () => Effect.succeed("windows" as const)),
				Match.when("darwin", () => Effect.succeed("macos" as const)),
				Match.when("linux", () => Effect.succeed("linux" as const)),
				Match.orElse((platform) =>
					Effect.fail(UnsupportedOperatingSystem.make({ platform })),
				),
			),
		),
	},
) {
	static readonly layer = Layer.effect(this, this.make);
}
