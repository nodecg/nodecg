import fs from "node:fs";
import path from "node:path";

import { expect } from "vitest";

import { setupTest } from "./helpers/setup";
import * as C from "./helpers/test-constants";

const test = await setupTest();

test("serves files from custom mountpoints", async () => {
	const response = await fetch(
		`${C.rootUrl()}bundles/test-bundle/custom-mount/hello-world.html`,
	);
	const bodyText = await response.text();

	const filePath = path.resolve(
		__dirname,
		"fixtures/nodecg-core/bundles/test-bundle/custom-mount-folder/hello-world.html",
	);
	expect(bodyText).toBe(fs.readFileSync(filePath, "utf-8"));
});

test("returns a 404 when the file is not found", async () => {
	const response = await fetch(
		`${C.rootUrl()}bundles/test-bundle/custom-mount/not-found.html`,
	);
	expect(response.status).toBe(404);
});
