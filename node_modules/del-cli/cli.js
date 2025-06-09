#!/usr/bin/env node
import process from 'node:process';
import meow from 'meow';
import {deleteAsync} from 'del';

const logEvent = event => {
	if (event.path !== undefined) {
		console.log(event.path);
	}
};

const noop = () => {};

const cli = meow(`
	Usage
	  $ del <path|glob> …

	Options
	  --force, -f    Allow deleting the current working directory and outside
	  --dry-run, -d  List what would be deleted instead of deleting
	  --verbose, -v  Display the absolute path of files and directories as they are deleted

	Examples
	  $ del unicorn.png rainbow.png
	  $ del "*.png" "!unicorn.png"
`, {
	importMeta: import.meta,
	flags: {
		force: {
			type: 'boolean',
			alias: 'f',
		},
		dryRun: {
			type: 'boolean',
			alias: 'd',
		},
		verbose: {
			type: 'boolean',
			alias: 'v',
		},
	},
});

if (cli.input.length === 0) {
	console.error('Specify at least one path');
	process.exitCode = 1;
} else {
	const {verbose, ...flags} = cli.flags;

	const onProgress = verbose ? logEvent : noop;

	const files = await deleteAsync(cli.input, {onProgress, ...flags});

	if (cli.flags.dryRun) {
		console.log(files.join('\n'));
	}
}
