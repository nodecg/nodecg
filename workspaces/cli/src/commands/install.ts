import { Effect } from "effect";
import { Command, Args, Options } from "@effect/cli";
import { FileSystemService } from "../services/file-system.js";
import { TerminalService } from "../services/terminal.js";
import { PathService } from "../services/path.js";
import { GitService } from "../services/git.js";
import { PackageResolverService } from "../services/package-resolver.js";
import { installBundleDeps } from "../lib/bundle-utils.js";
import * as semverLib from "../lib/semver.js";
import path from "node:path";

export const installCommand = Command.make(
	"install",
	{
		repo: Args.text({ name: "repo" }).pipe(Args.optional),
		dev: Options.boolean("dev").pipe(Options.withAlias("d"), Options.optional),
	},
	({ repo, dev }) =>
		Effect.fn("installCommand")(function* () {
			const fs = yield* FileSystemService;
			const terminal = yield* TerminalService;
			const pathService = yield* PathService;
			const git = yield* GitService;
			const packageResolver = yield* PackageResolverService;

			const isDev = dev ?? false;

			if (!repo) {
				yield* installBundleDeps(process.cwd(), isDev);
				return;
			}

			const { repo: repoName, range } =
				yield* packageResolver.parseVersionSpec(repo);
			const nodecgPath = yield* pathService.getNodeCGPath();

			const { url: repoUrl, name: bundleName } =
				yield* packageResolver.resolveGitUrl(repoName);

			const bundlesPath = path.join(nodecgPath, "bundles");
			const bundlesExists = yield* fs.exists(bundlesPath);
			if (!bundlesExists) {
				yield* fs.mkdir(bundlesPath);
			}

			const bundlePath = path.join(nodecgPath, "bundles", bundleName);

			yield* terminal.write(`Fetching `);
			yield* terminal.writeColored(bundleName, "magenta");
			yield* terminal.write(` release list... `);

			const tags = yield* git.listRemoteTags(repoUrl);
			const target = semverLib.maxSatisfying(
				tags
					.map((tag) => semverLib.coerce(tag))
					.filter((coercedTag): coercedTag is semver.SemVer =>
						Boolean(coercedTag),
					)
					.map((v) => v.version),
				range,
			);

			yield* terminal.writeColored("done!", "green");
			yield* terminal.writeLine("");

			yield* terminal.write(`Installing `);
			yield* terminal.writeColored(bundleName, "magenta");
			yield* terminal.write("... ");
			yield* git.clone(repoUrl, bundlePath);
			yield* terminal.writeColored("done!", "green");
			yield* terminal.writeLine("");

			if (target) {
				yield* terminal.write(`Checking out version ${target}... `);

				const checkoutEffect = git.checkout(target, bundlePath).pipe(
					Effect.catchAll(() => git.checkout(`v${target}`, bundlePath)),
				);

				yield* checkoutEffect;
				yield* terminal.writeColored("done!", "green");
				yield* terminal.writeLine("");
			}

			yield* installBundleDeps(bundlePath, isDev);
		}),
);
