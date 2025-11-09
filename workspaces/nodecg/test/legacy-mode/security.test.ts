import { expect } from "vitest";

import { setupTest } from "../helpers/setup";
import * as C from "../helpers/test-constants";

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
