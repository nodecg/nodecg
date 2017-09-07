'use strict';

const git = require('git-rev-sync');

module.exports = function (bundle) {
	const gitData = {};
	const workingDir = process.cwd();
	process.chdir(bundle.dir); // Needed for git-rev-sync to work.

	try {
		// These will error if bundle.dir is not a git repo
		gitData.branch = git.branch(bundle.dir);
		gitData.hash = git.long(bundle.dir);
		gitData.shortHash = git.short(bundle.dir);

		// These will error if bundle.dir is not a git repo and if `git` is not in $PATH
		gitData.date = git.date(bundle.dir);
		gitData.message = git.message(bundle.dir);
	} catch (e) {}

	process.chdir(workingDir);
	return gitData;
};
