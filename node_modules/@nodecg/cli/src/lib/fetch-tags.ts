import spawn from "nano-spawn";

export async function fetchTags(repoUrl: string) {
	const { stdout } = await spawn("git", [
		"ls-remote",
		"--refs",
		"--tags",
		repoUrl,
	]);
	return stdout
		.trim()
		.split("\n")
		.map((rawTag) => rawTag.split("refs/tags/").at(-1))
		.filter((t) => typeof t === "string");
}
