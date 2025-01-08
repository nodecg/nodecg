import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmpdir = os.tmpdir();
export function createTmpDir() {
	const dir = path.join(tmpdir, randomUUID());
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}
