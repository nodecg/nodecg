import { Data, Effect, Schema } from "effect";

import { CommandService } from "./command.js";
import { HttpService } from "./http.js";

export class NpmError extends Data.TaggedError("NpmError")<{
	readonly message: string;
	readonly operation: string;
}> {}

const NpmRegistrySchema = Schema.Struct({
	versions: Schema.Record({
		key: Schema.String,
		value: Schema.Unknown,
	}),
});

const NpmReleaseSchema = Schema.Struct({
	dist: Schema.Struct({
		tarball: Schema.String,
	}),
});

type NpmReleaseEncoded = typeof NpmReleaseSchema.Type;
export type NpmRelease = NpmReleaseEncoded;

export class NpmService extends Effect.Service<NpmService>()("NpmService", {
	effect: Effect.gen(function* () {
		const http = yield* HttpService;
		const cmd = yield* CommandService;

		return {
			listVersions: Effect.fn("listVersions")(function* (packageName: string) {
				const url = `https://registry.npmjs.org/${packageName}`;
				const data = yield* http.fetchJson(url, NpmRegistrySchema).pipe(
					Effect.mapError(
						() =>
							new NpmError({
								message: `Failed to fetch versions for ${packageName}`,
								operation: "list",
							}),
					),
				);
				return Object.keys(data.versions);
			}),

			getRelease: Effect.fn("getRelease")(function* (
				packageName: string,
				version: string,
			) {
				const url = `http://registry.npmjs.org/${packageName}/${version}`;
				return yield* http.fetchJson(url, NpmReleaseSchema).pipe(
					Effect.mapError(
						() =>
							new NpmError({
								message: `Failed to fetch release ${packageName}@${version}`,
								operation: "release",
							}),
					),
				);
			}),

			install: Effect.fn("install")(function* (
				cwd: string,
				production: boolean,
			) {
				const args = production ? ["install", "--production"] : ["install"];
				yield* cmd.exec("npm", args, { cwd }).pipe(
					Effect.mapError(
						() =>
							new NpmError({
								message: "Failed to install npm dependencies",
								operation: "install",
							}),
					),
				);
			}),

			yarnInstall: Effect.fn("yarnInstall")(function* (
				cwd: string,
				production: boolean,
			) {
				const args = production ? ["--production"] : [];
				yield* cmd.exec("yarn", args, { cwd }).pipe(
					Effect.mapError(
						() =>
							new NpmError({
								message: "Failed to install yarn dependencies",
								operation: "install",
							}),
					),
				);
			}),
		};
	}),
	dependencies: [HttpService.Default, CommandService.Default],
}) {}
