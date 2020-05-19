// Packages
import * as git from 'git-rev-sync';

// Ours
import { NodeCG } from '../../types/nodecg';

export default function(bundleDir: string): NodeCG.Bundle.GitData {
	const workingDir = process.cwd();
	let retValue: NodeCG.Bundle.GitData = null;
	try {
		// These will error if bundleDir is not a git repo
		const branch = (git.branch(bundleDir) as unknown) as string; // Typedefs are wrong for this
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
	} catch {}

	process.chdir(workingDir);
	return retValue;
}
