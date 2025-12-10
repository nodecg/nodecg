import { expect, test } from "vitest";

import { parseBundle } from ".";

test('when there is no "dashboard" folder, assign an empty array to bundle.dashboard.panels', () => {
	const parsedBundle = parseBundle("./test/fixtures/bundle-parser/no-panels");
	expect(parsedBundle.dashboard.panels).toEqual([]);
});

test('when there is a "dashboard" folder but no "dashboardPanels" property, throw an error', () => {
	expect(
		parseBundle.bind(
			parseBundle,
			"./test/fixtures/bundle-parser/no-panels-prop",
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: no-panels-prop has a "dashboard" folder, but no "nodecg.dashboardPanels" property was found in its package.json]`,
	);
});

test('when critical properties are missing from the "dashboardPanels" property, throw an error explaining what is missing', () => {
	expect(
		parseBundle.bind(
			parseBundle,
			"./test/fixtures/bundle-parser/missing-panel-props",
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: Panel #0 could not be parsed as it is missing the following properties: name, title, file]`,
	);
});

test("when two panels have the same name, throw an error", () => {
	expect(
		parseBundle.bind(
			parseBundle,
			"./test/fixtures/bundle-parser/dupe-panel-name",
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: Panel #1 (test) has the same name as another panel in dupe-panel-name.]`,
	);
});

test("when a panel's file has no <!DOCTYPE>, throw an error", () => {
	expect(
		parseBundle.bind(parseBundle, "./test/fixtures/bundle-parser/no-doctype"),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: Panel "panel.html" in bundle "no-doctype" has no DOCTYPE,panel resizing will not work. Add <!DOCTYPE html> to it.]`,
	);
});

test("when a panel's file has a BOM before it's <!DOCTYPE>, continue to parse it", () => {
	const parsedBundle = parseBundle("./test/fixtures/bundle-parser/bom-doctype");
	expect(Array.isArray(parsedBundle.dashboard.panels)).toBe(true);
});

test("when a panel's file does not exist, throw an error", () => {
	expect(
		parseBundle.bind(
			parseBundle,
			"./test/fixtures/bundle-parser/non-existant-panel",
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: Panel file "panel.html" in bundle "non-existant-panel" does not exist.]`,
	);
});

test("when a dialog has a workspace, throw an error", () => {
	expect(
		parseBundle.bind(
			parseBundle,
			"./test/fixtures/bundle-parser/dialog-workspace",
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: Dialog "panel.html" in bundle "dialog-workspace" has a "workspace" configured. Dialogs don't get put into workspaces. Either remove the "workspace" property from this dialog, or turn it into a normal panel by setting "dialog" to false.]`,
	);
});

test("when a dialog is fullbleed, throw an error", () => {
	expect(
		parseBundle.bind(
			parseBundle,
			"./test/fixtures/bundle-parser/dialog-fullbleed",
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: Panel "panel.html" in bundle "dialog-fullbleed" is fullbleed, but it also a dialog. Fullbleed panels cannot be dialogs. Either set fullbleed or dialog to false.]`,
	);
});

test("when a fullbleed panel has a workspace, throw an error", () => {
	expect(
		parseBundle.bind(
			parseBundle,
			"./test/fixtures/bundle-parser/fullbleed-workspace",
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: Panel "panel.html" in bundle "fullbleed-workspace" is fullbleed, but it also has a workspace defined. Fullbleed panels are not allowed to define a workspace, as they are automatically put into their own workspace. Either set fullbleed to false or remove the workspace property from this panel.]`,
	);
});

test("when a fullbleed panel has a defined width, throw an error", () => {
	expect(
		parseBundle.bind(
			parseBundle,
			"./test/fixtures/bundle-parser/fullbleed-width",
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: Panel "panel.html" in bundle "fullbleed-width" is fullbleed, but it also has a width defined. Fullbleed panels have their width set based on the, width of the browser viewport. Either set fullbleed to false or remove the width property from this panel.]`,
	);
});

test("when a panel has a workspace that begins with __nodecg, throw an error", () => {
	expect(
		parseBundle.bind(
			parseBundle,
			"./test/fixtures/bundle-parser/reserved-workspace__nodecg",
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: Panel "panel.html" in bundle "reserved-workspace__nodecg" is in a workspace whose name begins with __nodecg, which is a reserved string. Please change the name of this workspace to not begin with this string.]`,
	);
});

test("should parse workspaceOrder property when present", () => {
	const parsedBundle = parseBundle("./test/fixtures/bundle-parser/good-bundle");
	const workspacePanels = parsedBundle.dashboard.panels.filter(
		(panel) => panel.workspace === "foo",
	);
	expect(workspacePanels).toHaveLength(1);
	expect(workspacePanels[0]!.workspaceOrder).toBeUndefined();
});

test("should pass through workspaceOrder for regular panels", () => {
	const parsedBundle = parseBundle(
		"./test/fixtures/bundle-parser/workspace-order-test",
	);
	const panel = parsedBundle.dashboard.panels.find(
		(p) => p.name === "test-panel",
	);
	expect(panel).toBeDefined();
	expect(panel!.workspaceOrder).toBe(5);
	expect(panel!.workspace).toBe("ordered");
});

test("should pass through workspaceOrder for fullbleed panels", () => {
	const parsedBundle = parseBundle(
		"./test/fixtures/bundle-parser/fullbleed-order-test",
	);
	const panel = parsedBundle.dashboard.panels.find(
		(p) => p.name === "fullbleed-panel",
	);
	expect(panel).toBeDefined();
	expect(panel!.fullbleed).toBe(true);
	expect(panel!.workspaceOrder).toBe(3);
});
