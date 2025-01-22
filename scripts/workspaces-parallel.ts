import { join } from "node:path";
import { parseArgs } from "node:util";

import spawn from "nano-spawn";

import packageJson from "../package.json";

const {
	positionals: [command],
} = parseArgs({ allowPositionals: true });

if (!command) {
	throw new Error("Expected a command to run in all workspaces");
}

const processes = packageJson.workspaces.map((workspace) => {
	const workspacePath = join(__dirname, "..", workspace);
	const process = spawn("npm", ["run", command], {
		cwd: workspacePath,
		stdio: "inherit",
	});
	process.catch((error) => {
		console.error(error);
		void processes.map(async (p) => (await p.nodeChildProcess).kill());
	});
	return process;
});
