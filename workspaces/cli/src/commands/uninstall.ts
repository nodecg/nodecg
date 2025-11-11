import { Effect } from "effect";
import { Command, Args, Options } from "@effect/cli";
import { FileSystemService } from "../services/file-system.js";
import { TerminalService } from "../services/terminal.js";
import { PathService } from "../services/path.js";
import path from "node:path";

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
		Effect.fn("uninstallCommand")(function* () {
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

			let shouldDelete = force ?? false;
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
