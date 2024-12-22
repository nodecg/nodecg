// Packages
import test from "ava";

// Ours
import * as server from "./helpers/server";
server.setup();

import * as C from "./helpers/test-constants";
import type { NodeCG } from "../src/types/nodecg";

test("should load bundles which have satisfied bundle dependencies", (t) => {
	const allBundles: NodeCG.Bundle[] = (
		t as any
	).context.server._bundleManager.all();
	const foundBundle = allBundles.find(
		(bundle) => bundle.name === "satisfied-bundle-deps",
	);
	t.truthy(foundBundle);
});

test("should not load bundles which have unsatisfied bundle dependencies", (t) => {
	const allBundles: NodeCG.Bundle[] = (
		t as any
	).context.server._bundleManager.all();
	const foundBundle = allBundles.find(
		(bundle) => bundle.name === "unsatisfied-bundle-deps",
	);
	t.is(foundBundle, undefined);
});

test("should serve bundle-specific bower_components", async (t) => {
	const response = await fetch(
		`${C.bundleBowerComponentsUrl()}confirmation.js`,
	);
	t.is(response.status, 200);
	t.is(
		await response.text(),
		"const confirmed = 'bower_components_confirmed';\n",
	);
});

test("should serve bundle-specific node_modules", async (t) => {
	const response = await fetch(`${C.bundleNodeModulesUrl()}confirmation.js`);
	t.is(response.status, 200);
	t.is(await response.text(), "const confirmed = 'node_modules_confirmed';\n");
});

test("should 404 on non-existent bower_component", async (t) => {
	const response = await fetch(
		`${C.bundleBowerComponentsUrl()}confirmation_404.js`,
	);
	t.is(response.status, 404);
});

test("should 404 on non-existent node_module", async (t) => {
	const response = await fetch(
		`${C.bundleNodeModulesUrl()}confirmation_404.js`,
	);
	t.is(response.status, 404);
});

test("should 404 on non-existent bundle node_modules/bower_components", async (t) => {
	const response = await fetch(
		`${C.rootUrl()}bundles/false-bundle/node_modules/confirmation_404.js`,
	);
	t.is(response.status, 404);
});

test("should redirect /login/ to /dashboard/ when login security is disabled", async (t) => {
	const response = await fetch(C.loginUrl());
	t.is(response.status, 200);
	t.is(response.redirected, true);
	t.is(response.url, C.dashboardUrl());
});

test.serial("shared sources - 200", async (t) => {
	const response = await fetch(
		`${C.rootUrl()}bundles/test-bundle/shared/util.js`,
	);
	t.is(response.status, 200);
	t.is(
		await response.text(),
		"window.SharedUtility = {\n\tsomeFunc() {},\n};\n",
	);
});

test("shared sources - 404", async (t) => {
	const response = await fetch(
		`${C.rootUrl()}bundles/test-bundle/shared/404.js`,
	);
	t.is(response.status, 404);
});

test("shared sources - no bundle 404", async (t) => {
	const response = await fetch(
		`${C.rootUrl()}bundles/false-bundle/shared/404.js`,
	);
	t.is(response.status, 404);
});
