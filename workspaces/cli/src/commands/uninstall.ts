import path from "node:path";

import { Args, Command, Options } from "@effect/cli";
import { Effect, Option } from "effect";

import { FileSystemService } from "../services/file-system.js";
import { PathService } from "../services/path.js";
import { TerminalService } from "../services/terminal.js";

export const uninstallCommand = Command.make(
	"uninstall",
	{
		bundle: Args.text({ name: "bundle" }),
		force: Options.boolean("force").pipe(
			Options.withAlias("f"),
			Options.optional,
		),
	},
	({ bundle: bundleName, force }) =>
		Effect.gen(function* () {
			const fs = yield* FileSystemService;
			const terminal = yield* TerminalService;
			const pathService = yield* PathService;

			const nodecgPath = yield* pathService.getNodeCGPath();
			const bundlePath = path.join(nodecgPath, "bundles", bundleName);

			const exists = yield* fs.exists(bundlePath);
			if (!exists) {
				yield* terminal.write("Cannot uninstall ");
				yield* terminal.writeColored(bundleName, "magenta");
				yield* terminal.writeLine(": bundle is not installed.");
				return;
			}

			let shouldDelete = Option.getOrElse(force, () => false);
			if (!shouldDelete) {
				shouldDelete = yield* terminal.confirm(
					`Are you sure you wish to uninstall ${bundleName}?`,
				);
			}

			if (shouldDelete) {
				yield* terminal.write(`Uninstalling `);
				yield* terminal.writeColored(bundleName, "magenta");
				yield* terminal.write("... ");
				yield* fs.rm(bundlePath, { recursive: true, force: true });
				yield* terminal.writeColored("done!", "green");
				yield* terminal.writeLine("");
			}
		}),
);
