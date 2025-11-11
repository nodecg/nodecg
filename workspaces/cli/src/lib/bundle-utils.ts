import { Effect } from "effect";
import { FileSystemService } from "../services/file-system.js";
import { NpmService } from "../services/npm.js";
import { TerminalService } from "../services/terminal.js";
import { PathService } from "../services/path.js";
import path from "node:path";

export const installBundleDeps = (bundlePath: string, installDev: boolean) =>
	Effect.fn("installBundleDeps")(function* () {
		const fs = yield* FileSystemService;
		const npm = yield* NpmService;
		const terminal = yield* TerminalService;
		const pathService = yield* PathService;

		const isBundle = yield* pathService.isBundleFolder(bundlePath);
		if (!isBundle) {
			yield* terminal.writeError(
				`Error: There doesn't seem to be a valid NodeCG bundle in this folder:\n\t${bundlePath}`,
			);
			return yield* Effect.fail(
				new Error(`Not a valid bundle folder: ${bundlePath}`),
			);
		}

		const hasYarnLock = yield* fs.exists(path.join(bundlePath, "yarn.lock"));

		yield* terminal.write(
			`Installing npm dependencies (dev: ${installDev})... `,
		);

		if (hasYarnLock) {
			yield* npm.yarnInstall(bundlePath, !installDev);
		} else {
			yield* npm.install(bundlePath, !installDev);
		}

		yield* terminal.writeColored("done!", "green");
		yield* terminal.writeLine("");
	});
