import { expect } from "vitest";

import { setupTest } from "./helpers/setup";
import * as C from "./helpers/test-constants";

const test = await setupTest();

test("prevents directory traversal attacks", async () => {
	let response = await fetch(
		`${C.rootUrl()}bundles/test-bundle/shared/..%5c..%5c../should-be-forbidden.txt`,
	);
	expect(response.status).toBe(404);

	response = await fetch(
		`${C.rootUrl()}bundles/test-bundle/custom-mount/..%5c..%5c../should-be-forbidden.txt`,
	);
	expect(response.status).toBe(404);

	response = await fetch(
		`${C.rootUrl()}bundles/test-bundle/graphics/..%5c..%5c../should-be-forbidden.txt`,
	);
	expect(response.status).toBe(404);

	response = await fetch(
		`${C.rootUrl()}bundles/test-bundle/dashboard/..%5c..%5c../should-be-forbidden.txt`,
	);
	expect(response.status).toBe(404);

	if (process.platform === "win32") {
		response = await fetch(
			`${C.rootUrl()}assets/test-bundle/assets/..%5c..%5c..%5cshould-be-forbidden.txt`,
		);
		expect(response.status).toBe(404);
	} else {
		response = await fetch(
			`${C.rootUrl()}assets/test-bundle/assets/..%5c..%5c..%5c/should-be-forbidden.txt`,
		);
		expect(response.status).toBe(404);
	}
});

test("prevents path traversal in panel HTML files via injectScripts", async () => {
	// Verify that valid panel works (regression test)
	let response = await fetch(C.testPanelUrl());
	expect(response.status).toBe(200);
	const validContent = await response.text();
	expect(validContent).toContain("This is a test panel");

	// Attempt path traversal - should not serve content from outside dashboard dir
	// Even if a path matches a panel name in manifest, traversal should be blocked
	response = await fetch(
		`${C.rootUrl()}bundles/test-bundle/dashboard/../../../package.json`,
	);
	expect(response.status).toBe(404);
});

test("prevents path traversal in graphic HTML files via injectScripts", async () => {
	// Verify that valid graphic works (regression test)
	let response = await fetch(C.graphicUrl());
	expect(response.status).toBe(200);
	const validContent = await response.text();
	expect(validContent).toContain("<script");

	// Attempt path traversal - should not serve content from outside graphics dir
	response = await fetch(
		`${C.rootUrl()}bundles/test-bundle/graphics/../../../package.json`,
	);
	expect(response.status).toBe(404);
});

test("prevents path traversal in instance HTML files via injectScripts", async () => {
	// Verify that valid instance HTML works (regression test)
	let response = await fetch(`${C.rootUrl()}instance/killed.html`);
	expect(response.status).toBe(200);
	const validContent = await response.text();
	expect(validContent).toContain("<script");

	// Attempt path traversal - should not serve content from outside instance dir
	response = await fetch(`${C.rootUrl()}instance/../../package.json`);
	expect(response.status).toBe(404);

	response = await fetch(`${C.rootUrl()}instance/../server/config/index.js`);
	expect(response.status).toBe(404);
});
