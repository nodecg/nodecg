import { Effect, Data } from "effect";
import { HttpService } from "./http.js";
import { CommandService } from "./command.js";
import { Schema } from "@effect/schema";

export class NpmError extends Data.TaggedError("NpmError")<{
	readonly message: string;
	readonly operation: string;
}> {}

const NpmRegistrySchema = Schema.Struct({
	versions: Schema.Record(Schema.String, Schema.Unknown),
});

const NpmReleaseSchema = Schema.Struct({
	dist: Schema.Struct({
		tarball: Schema.String,
	}),
});

export type NpmRelease = Schema.Schema.Type<typeof NpmReleaseSchema>;

export class NpmService extends Effect.Service<NpmService>()("NpmService", {
	effect: Effect.fn("NpmService.make")(function* () {
		const http = yield* HttpService;
		const cmd = yield* CommandService;

		return {
			listVersions: (packageName: string) =>
				Effect.fn("listVersions")(function* () {
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

			getRelease: (packageName: string, version: string) =>
				Effect.fn("getRelease")(function* () {
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

			install: (cwd: string, production: boolean) =>
				Effect.fn("install")(function* () {
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

			yarnInstall: (cwd: string, production: boolean) =>
				Effect.fn("yarnInstall")(function* () {
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
