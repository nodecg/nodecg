import * as git from "git-rev-sync";

import type { NodeCG } from "../../types/nodecg";

export function parseGit(bundleDir: string): NodeCG.Bundle.GitData {
	const workingDir = process.cwd();
	let retValue: NodeCG.Bundle.GitData;
	try {
		// These will error if bundleDir is not a git repo
		const branch = git.branch(bundleDir);
		const hash = git.long(bundleDir);
		const shortHash = git.short(bundleDir);

		try {
			// Needed for the below commands to work.
			process.chdir(bundleDir);

			// These will error if bundleDir is not a git repo and if `git` is not in $PATH.
			const date = git.date().toISOString();
			const message = git.message();
			retValue = { branch, hash, shortHash, date, message };
		} catch {
			retValue = {
				branch,
				hash,
				shortHash,
			};
		}
	} catch {
		//
	}

	process.chdir(workingDir);
	return retValue;
}
