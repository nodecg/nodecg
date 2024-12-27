import test from "ava";
import fs from "fs";
import path from "path";

import * as server from "./helpers/server";
import * as C from "./helpers/test-constants";

server.setup();

test("serves files from custom mountpoints", async (t) => {
	const response = await fetch(
		`${C.rootUrl()}bundles/test-bundle/custom-mount/hello-world.html`,
	);
	const bodyText = await response.text();

	const filePath = path.resolve(
		__dirname,
		"fixtures/nodecg-core/bundles/test-bundle/custom-mount-folder/hello-world.html",
	);
	t.is(bodyText, fs.readFileSync(filePath, "utf-8"));
});

test("returns a 404 when the file is not found", async (t) => {
	const response = await fetch(
		`${C.rootUrl()}bundles/test-bundle/custom-mount/not-found.html`,
	);
	t.is(response.status, 404);
});
