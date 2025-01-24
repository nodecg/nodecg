import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export function setupTmpDir() {
	const dir = path.join(tmpdir(), randomUUID());
	mkdirSync(dir);
	return dir;
}
