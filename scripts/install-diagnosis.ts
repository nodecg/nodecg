import { createWriteStream } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { EOL, tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";

import spawn from "nano-spawn";

async function main() {
	const dir = await mkdtemp(tmpdir() + "/");

	await spawn("npm", ["run", "build"]);
	const { stdout: npmPackStdout } = await spawn("npm", ["pack"]);
	const tarball = npmPackStdout.trim().split(EOL).at(-1);
	if (!tarball) {
		throw new Error("No tarball found");
	}
	const packageFullPath = join(__dirname, "..", tarball);

	const logPath = join(__dirname, "../install.log");
	await rm(logPath, { force: true });
	const writeStream = createWriteStream(logPath);

	const { stdout, stderr } = spawn(
		"npm",
		["--loglevel=silly", "install", packageFullPath],
		{ cwd: dir },
	);

	async function* logWithTimestamp(source: AsyncIterable<string>) {
		for await (const chunk of source) {
			yield `${Date.now()} ${chunk}${EOL}`;
		}
	}

	await Promise.all([
		pipeline(stdout, logWithTimestamp, writeStream),
		pipeline(stderr, logWithTimestamp, writeStream),
	]);

	const logLines = (await readFile(logPath, "utf-8")).trim().split(EOL);

	const timeLogs: { timeSpent: number; line: string }[] = [];

	for (let i = 0; i < logLines.length; i++) {
		const line = logLines[i];
		if (typeof line === "undefined") {
			throw new Error("No log line found");
		}
		const nextLine = logLines[i + 1];
		if (typeof nextLine === "undefined") {
			continue;
		}
		const timestamp = getTimestamp(line);
		const nextTimestamp = getTimestamp(nextLine);
		const timeSpent = nextTimestamp - timestamp;
		timeLogs.push({ timeSpent, line });
	}

	const sortedTimeLogs = [...timeLogs].sort(
		(a, b) => b.timeSpent - a.timeSpent,
	);
	console.table(sortedTimeLogs.slice(0, 20));
}

void main();

function getTimestamp(line: string) {
	const match = /^(\d+)/.exec(line);
	if (!match?.[0]) {
		throw new Error("No timestamp found");
	}
	const timestamp = parseInt(match[0], 10);
	if (isNaN(timestamp)) {
		throw new Error("Invalid timestamp found");
	}
	return timestamp;
}
