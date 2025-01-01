import { execFileSync } from "child_process";

export function fetchTags(repoUrl: string) {
	return execFileSync("git", ["ls-remote", "--refs", "--tags", repoUrl])
		.toString("utf-8")
		.trim()
		.split("\n")
		.map((rawTag) => rawTag.split("refs/tags/").at(-1))
		.filter((t) => typeof t === "string");
}
