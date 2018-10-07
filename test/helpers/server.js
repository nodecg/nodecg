/* eslint-disable ava/no-ignored-test-files */

process.env.test = true;
process.env.NODECG_TEST = true;

// Native
import * as path from 'path';

// Packages
import test from 'ava';
import * as fse from 'fs-extra';
import * as temp from 'temp';

export const setup = (nodecgConfigName = 'nodecg.json') => {
	const tempFolder = temp.mkdirSync();
	temp.track(); // Automatically track and cleanup files at exit.

	// Tell NodeCG to look in our new temp folder for bundles, cfg, db, and assets, rather than whatever ones the user
	// may have. We don't want to touch any existing user data!
	process.env.NODECG_ROOT = tempFolder;

	fse.copySync('test/fixtures/nodecg-core/assets', path.join(tempFolder, 'assets'));
	fse.copySync('test/fixtures/nodecg-core/bundles', path.join(tempFolder, 'bundles'));
	fse.moveSync(path.join(tempFolder, 'bundles/test-bundle/git'), path.join(tempFolder, 'bundles/test-bundle/.git'));
	fse.copySync('test/fixtures/nodecg-core/cfg', path.join(tempFolder, 'cfg'));
	fse.copySync(`test/fixtures/nodecg-core/cfg/${nodecgConfigName}`, path.join(tempFolder, 'cfg/nodecg.json'));
	fse.copySync('test/fixtures/nodecg-core/db', path.join(tempFolder, 'db'));

	const C = require('./test-constants');
	const server = require(path.resolve(__dirname, '../../lib/server'));

	test.before(async () => {
		await new Promise((resolve, reject) => {
			server.on('started', resolve);
			server.on('error', reject);
			server.start();
		});
	});

	test.beforeEach(t => {
		t.context.server = server;
		t.context.apis = {
			extension: server.getExtensions()[C.bundleName()]
		};
	});

	test.after.always(() => {
		server.stop();
	});
};
