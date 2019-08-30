const git = require('simple-git/promise')();
const semver = require('semver');
const exec = require('child-process-promise').exec;
const spin = require('cli-spinner').Spinner;
const readline = require('readline');
const ghpages = require('gh-pages');
const fs = require('fs');
const rimraf = require('rimraf');

const isCI = process.env.CONTINUOUS_INTEGRATION || false;
const docsSite = process.env.DOCS_SITE || 'nodecg.com';

// These can't really be changed without a fair few changes to the code
const checkoutDir = './checkout';
const buildDir = './docs';

const shouldPush = process.argv.slice(2)[0] === 'publish';

let remote;
let gitUser;

if (isCI) {
	const ghToken = process.env.GITHUB_TOKEN;
	const gitSlug = process.env.TRAVIS_REPO_SLUG;

	remote = 'https://' + ghToken + '@github.com/' + gitSlug;

	gitUser = {
		name: 'NodeCG Docs Bot',
		email: 'docs@nodecg.com'
	};
}

let spinner;

function startSpinner(text) {
	spinner = spin(text + ' %s');
	spinner.start();
}

function stopSpinner(text = null, fail = false) {
	// Red text if this is a failure message, green if not
	const color = fail ? '\x1b[31m' : '\x1b[32m';

	spinner.stop();
	process.stdout.clearLine();
	readline.cursorTo(process.stdout, 0);

	if (text) {
		process.stdout.write(color + text + '\x1b[0m');
	}

	process.stdout.write('\n');
}

// Build and publish docs for the current commit
function buildLatest() {
	return exec('node ./scripts/readme-toc.js')
		.then(() => {
			return exec('jsdoc -c .jsdoc.json -d ' + buildDir + '/master');
		});
}

// Search git tags and find versions that should be built
function fetchVersions() {
	return git.tags()
		.then(tags => {
			const desiredVersions = [];

			// Get all version tags. Only go as far back as 0.7
			const allVersions = tags.all.filter(tag => semver.valid(tag) && semver.gte(tag, '0.7.0'));

			// Find the latest patch for each major.minor version and add it to desiredVersions
			allVersions.forEach(version => {
				if (semver.maxSatisfying(allVersions, semver.major(version) + '.' + semver.minor(version) + '.x') === version) {
					desiredVersions.push({tag: version, versionName: 'v' + semver.major(version) + '.' + semver.minor(version)});
				}
			});

			return desiredVersions;
		});
}

function delBuildFolder() {
	return new Promise(resolve => {
		rimraf(buildDir, resolve);
	});
}

function delCheckoutDirectory() {
	return new Promise(resolve => {
		rimraf(checkoutDir, resolve);
	});
}

// Build docs for a specific version
function buildVersion(version) {
	// Delete and recreate checkout directory
	return delCheckoutDirectory()
		.then(() => {
			fs.mkdirSync(checkoutDir, {recursive: true});
		})

		.then(() => {
			return git
				.raw(['--work-tree=' + checkoutDir, 'checkout', version.tag, '--', './tutorials'])
				.then(() => git.raw(['--work-tree=' + checkoutDir, 'checkout', version.tag, '--', './lib/api.js']))
				.then(() => git.raw(['--work-tree=' + checkoutDir, 'checkout', version.tag, '--', './README.md']))
				.then(() => git.raw(['--work-tree=' + checkoutDir, 'checkout', version.tag, '--', './scripts/readme-toc.js']));
		})

		.then(() => {
			return exec('node ./scripts/readme-toc.js', {cwd: checkoutDir});
		})
		.catch(() => {
			// Some versions have no reademe-toc script, so continue if it errors
		})
		.then(() => {
			// Run the docs build command and output to version sub-directory
			return exec('jsdoc -c ../.jsdoc.json -d ../' + buildDir + '/' + version.versionName, {cwd: checkoutDir});
		});
}

function createIndexFile(redirectVersion) {
	const indexFile = buildDir + '/index.html';

	// Copy index template into docs directory
	return new Promise((resolve, reject) => {
		fs.copyFile('./scripts/docs_index.html', indexFile, err => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	})
		.then(() => {
			// Read the copied template
			return new Promise((resolve, reject) => {
				fs.readFile(indexFile, 'utf8', (err, data) => {
					if (err) {
						console.log(err);
						reject(err);
					} else {
						resolve(data);
					}
				});
			});
		})
		.then(data => {
			const result = data.replace(/%VERSION%/g, redirectVersion);

			// Rewrite the file with the applied version
			return new Promise((resolve, reject) => {
				fs.writeFile(indexFile, result, 'utf8', err => {
					if (err) {
						console.log(err);
						reject(err);
					} else {
						resolve();
					}
				});
			});
		});
}

function createVersionsFile(versions) {
	const versionsFile = buildDir + '/versions.json';

	// Sort versions in descending order
	versions.sort((a, b) => semver.rcompare(a.tag, b.tag));

	// Add master at the start
	versions.unshift({versionName: 'master', tag: 'master'});

	const fileContents = JSON.stringify(versions);

	// Write JSON array of versions to file
	return new Promise((resolve, reject) => {
		fs.writeFile(versionsFile, fileContents, 'utf8', err => {
			if (err) {
				console.log(err);
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

function publish() {
	return exec('echo ' + docsSite + ' >> ' + buildDir + '/CNAME')
		.then(() => {
			return new Promise((resolve, reject) => {
				ghpages.publish(buildDir, {
					message: 'Update docs',
					src: '**',
					repo: remote,
					user: gitUser,
					silent: true
				}, err => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		});
}

async function run() {
	startSpinner('Fetching versions...');

	// These tasks can run simultaneously
	const setupResults = await Promise.all([fetchVersions(), delBuildFolder()]);
	const versionsToBuild = setupResults[0];

	stopSpinner('Fetched Versions');

	// Build latest from current commit
	startSpinner('Building latest...');
	await buildLatest();
	stopSpinner('Built latest');

	let redirectVersion = 'master';

	if (versionsToBuild.length > 0) {
		// Build all found versions
		for (let i = 0; i < versionsToBuild.length; i++) {
			startSpinner('Building ' + versionsToBuild[i].versionName + '...');

			try {
				// eslint-disable-next-line no-await-in-loop
				await buildVersion(versionsToBuild[i]);

				stopSpinner('Built ' + versionsToBuild[i].versionName);
			} catch (err) {
				stopSpinner('Failed to build ' + versionsToBuild[i].versionName, true);
				process.stdout.write(err.stderr || err);
				process.stdout.write('\n');
			}
		}

		await delCheckoutDirectory();

		startSpinner('Creating versions file...');
		await createVersionsFile(versionsToBuild);
		stopSpinner('Created Versions File');

		redirectVersion = versionsToBuild[versionsToBuild.length - 1].versionName;
	} else {
		console.log('No tags found to build, only master built');
	}

	startSpinner('Creating index file...');
	await createIndexFile(redirectVersion);
	stopSpinner('Created Index File');

	await git.raw(['reset']);

	if (shouldPush) {
		startSpinner('Publishing to gh-pages...');

		try {
			await publish();

			stopSpinner('Successfully Published');
		} catch (err) {
			stopSpinner('FAILED TO PUBLISH', true);
			process.exit(1);
		}
	} else {
		console.log('\x1b[33m%s\x1b[0m', 'Skipping Publish');
	}

	console.log();
	console.log('\x1b[42mDocs Build complete\x1b[0m');
}

run();
