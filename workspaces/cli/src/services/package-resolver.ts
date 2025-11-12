import { Effect, Data } from "effect";
import HostedGitInfo from "hosted-git-info";
import npa from "npm-package-arg";

export class PackageResolverError extends Data.TaggedError(
	"PackageResolverError",
)<{
	readonly message: string;
	readonly spec: string;
}> {}

export type GitRepoInfo = {
	url: string;
	name: string;
};

export type PackageSpec = {
	repo: string;
	range: string;
};

export class PackageResolverService extends Effect.Service<PackageResolverService>()(
	"PackageResolverService",
	{
		sync: () => ({
			resolveGitUrl: (spec: string) =>
				Effect.gen(function* () {
					const parsed = npa(spec);

					if (!parsed.hosted) {
						return yield* Effect.fail(
							new PackageResolverError({
								message: "Not a valid git repository spec",
								spec,
							}),
						);
					}

					const hostedInfo = parsed.hosted as unknown as HostedGitInfo;
					const url = hostedInfo.https();

					if (!url) {
						return yield* Effect.fail(
							new PackageResolverError({
								message: "Could not resolve git URL",
								spec,
							}),
						);
					}

					const temp = url.split("/").pop();
					if (!temp) {
						return yield* Effect.fail(
							new PackageResolverError({
								message: "Could not extract repository name",
								spec,
							}),
						);
					}

					const name = temp.slice(0, temp.length - 4);

					return { url, name } as GitRepoInfo;
				}),

			parseVersionSpec: (spec: string) =>
				Effect.gen(function* () {
					if (spec.indexOf("#") <= 0) {
						return { repo: spec, range: "" } as PackageSpec;
					}

					const repoParts = spec.split("#");
					const repo = repoParts[0];
					const range = repoParts[1];

					if (!repo) {
						return yield* Effect.fail(
							new PackageResolverError({
								message: "Invalid package spec format",
								spec,
							}),
						);
					}

					return { repo, range: range ?? "" } as PackageSpec;
				}),
		}),
	},
) {}
