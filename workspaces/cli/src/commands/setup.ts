import { Effect } from "effect";
import { Command, Args, Options } from "@effect/cli";
import { FileSystemService } from "../services/file-system.js";
import { TerminalService } from "../services/terminal.js";
import { PathService } from "../services/path.js";
import { HttpService } from "../services/http.js";
import { NpmService } from "../services/npm.js";
import * as semverLib from "../lib/semver.js";

export const setupCommand = Command.make(
	"setup",
	{
		version: Args.text({ name: "version" }).pipe(Args.optional),
		update: Options.boolean("update").pipe(
			Options.withAlias("u"),
			Options.optional,
		),
		skipDependencies: Options.boolean("skip-dependencies").pipe(
			Options.withAlias("k"),
			Options.optional,
		),
	},
	({ version, update, skipDependencies }) =>
		Effect.gen(function* () {
			const fs = yield* FileSystemService;
			const terminal = yield* TerminalService;
			const pathService = yield* PathService;
			const npm = yield* NpmService;
			const http = yield* HttpService;

			let isUpdate = false;

			const containsNodeCG =
				yield* pathService.pathContainsNodeCG(process.cwd());
			if (containsNodeCG) {
				if (!update) {
					yield* terminal.writeError(
						"NodeCG is already installed in this directory.",
					);
					yield* terminal.write("Use ");
					yield* terminal.writeColored("nodecg setup [version] -u", "cyan");
					yield* terminal.writeLine(
						" if you want update your existing install.",
					);
					return;
				}
				isUpdate = true;
			}

			if (version) {
				yield* terminal.write(
					`Finding latest release that satisfies semver range `,
				);
				yield* terminal.writeColored(version, "magenta");
				yield* terminal.write("... ");
			} else if (isUpdate) {
				yield* terminal.write("Checking against local install for updates... ");
			} else {
				yield* terminal.write("Finding latest release... ");
			}

			const tags = yield* npm.listVersions("nodecg");

			const target = version
				? semverLib.maxSatisfying(tags, version)
				: semverLib.maxSatisfying(tags, "");

			if (!target) {
				yield* terminal.writeColored("failed!", "red");
				yield* terminal.writeLine("");
				yield* terminal.writeError(
					version
						? `No releases match the supplied semver range (${version})`
						: "No releases found",
				);
				return;
			}

			yield* terminal.writeColored("done!", "green");
			yield* terminal.writeLine("");

			let current: string | undefined;
			let downgrade = false;

			if (isUpdate) {
				current = yield* pathService.getCurrentNodeCGVersion();

				if (semverLib.eq(target, current)) {
					yield* terminal.write(`The target version (`);
					yield* terminal.writeColored(target, "magenta");
					yield* terminal.write(`) is equal to the current version (`);
					yield* terminal.writeColored(current, "magenta");
					yield* terminal.writeLine(`). No action will be taken.`);
					return;
				}

				if (semverLib.lt(target, current)) {
					yield* terminal.writeColored("WARNING:", "red");
					yield* terminal.write(` The target version (`);
					yield* terminal.writeColored(target, "magenta");
					yield* terminal.write(`) is older than the current version (`);
					yield* terminal.writeColored(current, "magenta");
					yield* terminal.writeLine(`)`);

					const answer = yield* terminal.confirm(
						"Are you sure you wish to continue?",
					);
					if (!answer) {
						yield* terminal.writeLine("Setup cancelled.");
						return;
					}

					downgrade = true;
				}
			}

			if (semverLib.lt(target, "v2.0.0")) {
				yield* terminal.writeError(
					"CLI does not support NodeCG versions older than v2.0.0.",
				);
				return;
			}

			// Install NodeCG
			if (isUpdate) {
				const deletingDirectories = [".git", "build", "scripts", "schemas"];
				yield* Effect.all(
					deletingDirectories.map((dir) =>
						fs.rm(dir, { recursive: true, force: true }),
					),
					{ concurrency: "unbounded" },
				);
			}

			yield* terminal.write(`Downloading `);
			yield* terminal.writeColored(target, "magenta");
			yield* terminal.write(` from npm... `);

			const targetVersion = semverLib.coerce(target)?.version;
			if (!targetVersion) {
				yield* terminal.writeError("Failed to determine target NodeCG version");
				return;
			}

			const release = yield* npm.getRelease("nodecg", targetVersion);

			yield* terminal.writeColored("done!", "green");
			yield* terminal.writeLine("");

			if (current) {
				const verb = semverLib.lt(target, current)
					? "Downgrading"
					: "Upgrading";
				yield* terminal.write(`${verb} from `);
				yield* terminal.writeColored(current, "magenta");
				yield* terminal.write(` to `);
				yield* terminal.writeColored(target, "magenta");
				yield* terminal.write("... ");
			}

			const tarballStream = yield* http.fetchStream(release.dist.tarball);
			yield* fs.extractTarball(tarballStream, { strip: 1 });

			// Install dependencies
			if (!skipDependencies) {
				yield* terminal.write("Installing production npm dependencies... ");
				yield* npm.install(process.cwd(), true);
				yield* terminal.writeColored("done!", "green");
				yield* terminal.writeLine("");
			}

			if (isUpdate) {
				const verb = downgrade ? "downgraded" : "upgraded";
				yield* terminal.write(`NodeCG ${verb} to `);
				yield* terminal.writeColored(target, "magenta");
				yield* terminal.writeLine("");
			} else {
				yield* terminal.writeLine(
					`NodeCG (${target}) installed to ${process.cwd()}`,
				);
			}
		}),
);
