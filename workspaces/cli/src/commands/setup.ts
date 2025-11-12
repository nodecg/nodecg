import { Effect, Option } from "effect";
import { Command, Args, Options } from "@effect/cli";
import semver from "semver";
import { FileSystemService } from "../services/file-system.js";
import { TerminalService } from "../services/terminal.js";
import { PathService } from "../services/path.js";
import { HttpService } from "../services/http.js";
import { NpmService } from "../services/npm.js";

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

			const isUpdateFlag = Option.getOrElse(update, () => false);
			const skipDeps = Option.getOrElse(skipDependencies, () => false);
			const versionSpec = Option.getOrNull(version);

			let isUpdate = false;

			const containsNodeCG =
				yield* pathService.pathContainsNodeCG(process.cwd());
			if (containsNodeCG) {
				if (!isUpdateFlag) {
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

			if (versionSpec) {
				yield* terminal.write(
					`Finding latest release that satisfies semver range `,
				);
				yield* terminal.writeColored(versionSpec, "magenta");
				yield* terminal.write("... ");
			} else if (isUpdate) {
				yield* terminal.write("Checking against local install for updates... ");
			} else {
				yield* terminal.write("Finding latest release... ");
			}

			const tags = yield* npm.listVersions("nodecg");

			const target = semver.maxSatisfying(tags, versionSpec || "*");

			if (!target) {
				yield* terminal.writeColored("failed!", "red");
				yield* terminal.writeLine("");
				yield* terminal.writeError(
					versionSpec
						? `No releases match the supplied semver range (${versionSpec})`
						: "Failed to find a suitable release",
				);
				return;
			}

			yield* terminal.writeColored("done!", "green");
			yield* terminal.writeLine("");

			let current: string | undefined;
			let downgrade = false;
			if (isUpdate) {
				current = yield* pathService
					.getCurrentNodeCGVersion()
					.pipe(Effect.option, Effect.map((opt) => Option.getOrElse(opt, () => undefined)));
				if (current && semver.eq(current, target)) {
					yield* terminal.writeLine(
						`The target version (${target}) is equal to the current version (${current}). No action will be taken.`,
					);
					return;
				}
				if (current && semver.gte(current, target)) {
					downgrade = true;
					const msg = `You are about to downgrade from ${current} to ${target}. Are you sure?`;
					const confirmed = yield* terminal.confirm(msg);
					if (!confirmed) {
						yield* terminal.writeLine(
							"Aborting setup due to user response.",
						);
						return;
					}
				}
			} else {
				yield* terminal.write(`Installing NodeCG version `);
				yield* terminal.writeColored(target, "magenta");
				yield* terminal.write("... ");
			}

			const release = yield* npm.getRelease("nodecg", target);

			if (current) {
				const verb = semver.lt(target, current)
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
			if (!skipDeps) {
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
