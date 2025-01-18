import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";

export async function createTmpDir() {
	const dir = await mkdtemp(tmpdir() + "/");
	return dir;
}
