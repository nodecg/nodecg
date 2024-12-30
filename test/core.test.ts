import { expect } from "vitest";

import type { NodeCG } from "../src/types/nodecg";
import { setupTest } from "./helpers/setup";
import * as C from "./helpers/test-constants";

const test = await setupTest();

test("should load bundles which have satisfied bundle dependencies", ({
	server,
}) => {
	const allBundles: NodeCG.Bundle[] = (server as any)._bundleManager.all();
	const foundBundle = allBundles.find(
		(bundle) => bundle.name === "satisfied-bundle-deps",
	);
	expect(foundBundle).toBeTruthy();
});

test("should not load bundles which have unsatisfied bundle dependencies", ({
	server,
}) => {
	const allBundles: NodeCG.Bundle[] = (server as any)._bundleManager.all();
	const foundBundle = allBundles.find(
		(bundle) => bundle.name === "unsatisfied-bundle-deps",
	);
	expect(foundBundle).toBe(undefined);
});

test("should serve bundle-specific bower_components", async () => {
	const response = await fetch(
		`${C.bundleBowerComponentsUrl()}confirmation.js`,
	);
	expect(response.status).toBe(200);
	expect(await response.text()).toMatchInlineSnapshot(`
		"const confirmed = 'bower_components_confirmed';
		"
	`);
});

test("should serve bundle-specific node_modules", async () => {
	const response = await fetch(`${C.bundleNodeModulesUrl()}confirmation.js`);
	expect(response.status).toBe(200);
	expect(await response.text()).toMatchInlineSnapshot(`
		"const confirmed = 'node_modules_confirmed';
		"
	`);
});

test("should 404 on non-existent bower_component", async () => {
	const response = await fetch(
		`${C.bundleBowerComponentsUrl()}confirmation_404.js`,
	);
	expect(response.status).toBe(404);
});

test("should 404 on non-existent node_module", async () => {
	const response = await fetch(
		`${C.bundleNodeModulesUrl()}confirmation_404.js`,
	);
	expect(response.status).toBe(404);
});

test("should 404 on non-existent bundle node_modules/bower_components", async () => {
	const response = await fetch(
		`${C.rootUrl()}bundles/false-bundle/node_modules/confirmation_404.js`,
	);
	expect(response.status).toBe(404);
});

test("should redirect /login/ to /dashboard/ when login security is disabled", async () => {
	const response = await fetch(C.loginUrl());
	expect(response.status).toBe(200);
	expect(response.redirected).toBe(true);
	expect(response.url).toBe(C.dashboardUrl());
});

test("shared sources - 200", async () => {
	const response = await fetch(
		`${C.rootUrl()}bundles/test-bundle/shared/util.js`,
	);
	expect(response.status).toBe(200);
	expect(await response.text()).toMatchInlineSnapshot(`
		"window.SharedUtility = {
			someFunc() {},
		};
		"
	`);
});

test("shared sources - 404", async () => {
	const response = await fetch(
		`${C.rootUrl()}bundles/test-bundle/shared/404.js`,
	);
	expect(response.status).toBe(404);
});

test("shared sources - no bundle 404", async () => {
	const response = await fetch(
		`${C.rootUrl()}bundles/false-bundle/shared/404.js`,
	);
	expect(response.status).toBe(404);
});
