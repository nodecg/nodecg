// Native
import path from "path";

// Packages
import type { TestFn } from "ava";
import anyTest from "ava";
import fse from "fs-extra";
import tmp from "tmp-promise";

// Ours
import * as C from "./test-constants";
// Doing some tricks here:
// This import is ONLY for a type.
// The import for the value is later in this file.
import type { NodeCGServer } from "../../src/server/server";
import type { serverApiFactory } from "../../src/server/api.server";
import { populateTestData } from "./populateTestData";

export interface ServerContext {
	server: NodeCGServer;
	apis: { extension: InstanceType<ReturnType<typeof serverApiFactory>> };
}

const test = anyTest as TestFn<ServerContext>;

export const setup = (nodecgConfigName = "nodecg.json"): void => {
	tmp.setGracefulCleanup();
	const tempFolder = tmp.dirSync().name;

	// Tell NodeCG to look in our new temp folder for bundles, cfg, db, and assets, rather than whatever ones the user
	// may have. We don't want to touch any existing user data!
	process.env.NODECG_ROOT = tempFolder;

	fse.copySync(
		"test/fixtures/nodecg-core/assets",
		path.join(tempFolder, "assets"),
	);
	fse.copySync(
		"test/fixtures/nodecg-core/bundles",
		path.join(tempFolder, "bundles"),
	);
	fse.moveSync(
		path.join(tempFolder, "bundles/test-bundle/git"),
		path.join(tempFolder, "bundles/test-bundle/.git"),
	);
	fse.copySync("test/fixtures/nodecg-core/cfg", path.join(tempFolder, "cfg"));
	fse.copySync(
		`test/fixtures/nodecg-core/cfg/${nodecgConfigName}`,
		path.join(tempFolder, "cfg/nodecg.json"),
	);
	fse.writeFileSync(
		path.join(tempFolder, "should-be-forbidden.txt"),
		"exploit succeeded",
		"utf-8",
	);

	let server: NodeCGServer;
	test.before(async () => {
		// We need to delay importing this,
		// so that we have time to set up the temp
		// process.env.NODECG_ROOT folder.
		const { NodeCGServer } = await import("../../src/server/server");
		server = new NodeCGServer();

		await populateTestData();
		await server.start();
	});

	test.after.always(() => {
		if (server) {
			void server.stop();
		}
	});

	test.beforeEach((t) => {
		t.context.server = server;
		t.context.apis = {
			extension: server.getExtensions()[C.bundleName()] as any,
		};
	});
};
