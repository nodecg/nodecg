import fs from "node:fs";
import path from "node:path";

import { expect } from "vitest";

import * as C from "../helpers/test-constants";
import { invokeAck } from "../helpers/utilities";
import { setupInstalledModeTest } from "./setup";

const test = await setupInstalledModeTest();

test("should start server in installed mode", ({ server }) => {
	expect(server).toBeDefined();
	expect(C.rootUrl()).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/$/);
});

test("should load bundles in installed mode", ({ apis }) => {
	expect(apis.extension).toBeDefined();
	expect(apis.extension.bundleName).toBe(C.bundleName());
});

test("should create and read replicants", async ({ apis }) => {
	const testReplicant = apis.extension.Replicant("test-replicant", {
		defaultValue: "initial",
	});

	await new Promise((resolve) => {
		if (testReplicant.value === "initial") {
			resolve(undefined);
		} else {
			testReplicant.once("change", () => resolve(undefined));
		}
	});

	expect(testReplicant.value).toBe("initial");

	testReplicant.value = "updated";
	await new Promise((resolve) => {
		testReplicant.once("change", () => resolve(undefined));
	});

	expect(testReplicant.value).toBe("updated");
});

test("should serve bundle graphics", async () => {
	const response = await fetch(`${C.graphicUrl()}index.html`);
	expect(response.status).toBe(200);
	const text = await response.text();
	expect(text).toContain("<!DOCTYPE html>");
});

test("should serve bundle assets", async () => {
	const response = await fetch(
		`${C.bundleNodeModulesUrl()}dummy-module/confirmation.js`,
	);
	expect(response.status).toBe(200);
	expect(await response.text()).toContain("node_modules_confirmed");
});

test("should serve scoped packages from bundle node_modules", async () => {
	const response = await fetch(
		`${C.bundleNodeModulesUrl()}@test-scope/simple-package/index.js`,
	);
	expect(response.status).toBe(200);
	expect(await response.text()).toContain("scoped_package_confirmed");
});

test("should serve deeply nested scoped packages from bundle node_modules", async () => {
	const response = await fetch(
		`${C.bundleNodeModulesUrl()}@test-scope/nested-package/lib/index.js`,
	);
	expect(response.status).toBe(200);
	expect(await response.text()).toContain("scoped_nested_confirmed");
});

test("should serve deeply nested files from bundle node_modules", async () => {
	const response = await fetch(
		`${C.bundleNodeModulesUrl()}deep-package/dist/cjs/lib/index.js`,
	);
	expect(response.status).toBe(200);
	expect(await response.text()).toContain("deep_nested_confirmed");
});

test("should handle client-server messaging", async ({ apis, dashboard }) => {
	apis.extension.listenFor("installedModeTest", (_, cb) => {
		invokeAck(cb, null, "response from server");
	});

	const result = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				window.dashboardApi.sendMessage(
					"installedModeTest",
					null,
					(err: any, data: any) => {
						if (err) {
							resolve(`error: ${err.message}`);
						} else {
							resolve(data);
						}
					},
				);
			}),
	);

	expect(result).toBe("response from server");
});

test("should load dashboard in installed mode", async ({ dashboard }) => {
	expect(dashboard).toBeDefined();
	const hasApi = await dashboard.evaluate(
		() => typeof window.dashboardApi !== "undefined",
	);
	expect(hasApi).toBe(true);
});

test("should serve updated graphic after file change without restart", async ({
	browser,
}) => {
	// Navigate to the graphic
	const graphicPage = await browser.newPage();
	await graphicPage.goto(`${C.graphicUrl()}index.html`);
	await graphicPage.waitForFunction(
		() => typeof window.graphicApi !== "undefined",
	);

	// Verify marker doesn't exist yet
	const markerBefore = await graphicPage.$("#test-marker-updated");
	expect(markerBefore).toBeNull();

	// Modify the graphic HTML file on disk
	// In installed mode, the bundle IS the project root
	const graphicPath = path.join(
		process.env.NODECG_ROOT!,
		"graphics/index.html",
	);
	const originalContent = fs.readFileSync(graphicPath, "utf-8");

	try {
		const updatedContent = originalContent.replace(
			"</body>",
			'<div id="test-marker-updated">UPDATED CONTENT</div>\n\t</body>',
		);
		fs.writeFileSync(graphicPath, updatedContent);

		// Reload the page (simulates user refreshing browser)
		await graphicPage.reload();
		await graphicPage.waitForFunction(
			() => typeof window.graphicApi !== "undefined",
		);

		// Verify new content is served
		await graphicPage.waitForSelector("#test-marker-updated");
		const updatedMarkerText = await graphicPage.$eval(
			"#test-marker-updated",
			(el) => el.textContent,
		);
		expect(updatedMarkerText).toBe("UPDATED CONTENT");
	} finally {
		// Restore original file even if test fails
		fs.writeFileSync(graphicPath, originalContent);
		await graphicPage.close();
	}
});
