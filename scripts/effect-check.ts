import { spawnSync } from "node:child_process";

import getExePath from "@effect/tsgo/lib/getExePath";

const { status, error } = spawnSync(
	getExePath(),
	["-b", "--noEmit", ...process.argv.slice(2)],
	{ stdio: "inherit" },
);
if (typeof error !== "undefined") {
	throw error;
}
process.exit(status ?? 1);
