import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

export function createTmpDir() {
	const dir = mkdtempSync(tmpdir() + "/");
	return dir;
}
