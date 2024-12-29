import { expect } from "vitest";

import { setupTest } from "./helpers/setup";
import * as C from "./helpers/test-constants";

const test = await setupTest();

test("should redirect /graphics to /graphics/", async () => {
	const response = await fetch(C.graphicUrl().slice(0, -1));
	expect(response.status).toBe(200);
	expect(response.redirected).toBe(true);
	expect(response.url).toBe(C.graphicUrl());
});

test("should 404 on non-existent file", async () => {
	const response = await fetch(`${C.graphicUrl()}confirmation_404.js`);
	expect(response.status).toBe(404);
});

test("should 404 on non-existent bundle", async () => {
	const response = await fetch(
		`${C.rootUrl()}bundles/false-bundle/graphics/confirmation_404.js`,
	);
	expect(response.status).toBe(404);
});
