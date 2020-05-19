// Native
import path from 'path';

// Packages
import anyTest, { TestInterface } from 'ava';
import fse from 'fs-extra';
import temp from 'temp';

// Ours
import * as C from './test-constants';
// Doing some tricks here:
// This import is ONLY for a type.
// The import for the value is later in this file.
import NodeCGServer from '../../build/server/server';
import serverApiFactory from '../../build/server/api.server';
import populateTestData from './populateTestData';

export type ServerContext = {
	server: NodeCGServer;
	apis: { extension: InstanceType<ReturnType<typeof serverApiFactory>> };
};

const test = anyTest as TestInterface<ServerContext>;

export const setup = (nodecgConfigName = 'nodecg.json'): void => {
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

	let server: NodeCGServer;
	test.before(async () => {
		// We need to delay importing this,
		// so that we have time to set up the temp
		// process.env.NODECG_ROOT folder.
		const { default: NodeCGServer } = await import('../../build/server/server');
		server = new NodeCGServer();

		await populateTestData();
		await server.start();
	});

	test.after.always(() => {
		if (server) {
			server.stop();
		}
	});

	test.beforeEach(t => {
		t.context.server = server;
		t.context.apis = {
			extension: server.getExtensions()[C.bundleName()] as any,
		};
	});
};
