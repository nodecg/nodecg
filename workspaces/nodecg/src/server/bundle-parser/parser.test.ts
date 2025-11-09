import { expect, test } from "vitest";

import { testDirPath } from "../../../test/helpers/test-dir-path";
import { parseBundle } from ".";

test("should error when package.json does not exist", () => {
	expect(
		parseBundle.bind(parseBundle, testDirPath("")),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: Bundle at path ./workspaces/nodecg/test does not contain a package.json!]`,
	);
});

test('should error when package.json has no "nodecg" property', () => {
	expect(
		parseBundle.bind(
			parseBundle,
			testDirPath("fixtures/bundle-parser/no-nodecg-prop"),
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: no-nodecg-prop's package.json lacks a "nodecg" property, and therefore cannot be parsed.]`,
	);
});

test("should error when package.json is not valid JSON", () => {
	expect(
		parseBundle.bind(
			parseBundle,
			testDirPath("fixtures/bundle-parser/invalid-manifest-json"),
		),
	).toThrowError(
		/package\.json is not valid JSON, please check it against a validator such as jsonlint\.com/,
	);
});

test('should return the expected data when "nodecg" property does exist', () => {
	const parsedBundle = parseBundle(
		testDirPath("fixtures/bundle-parser/good-bundle"),
	);
	expect(parsedBundle.name).toBe("good-bundle");
	expect(parsedBundle.version).toBe("0.0.1");
	expect(parsedBundle.description).toBe("A test bundle");
	expect(parsedBundle.homepage).toBe("http://github.com/nodecg");
	expect(parsedBundle.author).toBe("Alex Van Camp <email@alexvan.camp>");
	expect(parsedBundle.contributors).toEqual(["Matt McNamara"]);
	expect(parsedBundle.license).toBe("MIT");
	expect(parsedBundle.compatibleRange).toBe("~0.7.0");
	expect(parsedBundle.bundleDependencies).toBe(undefined);
	expect(parsedBundle.dir).toBeTypeOf("string");
	expect(parsedBundle.dashboard.dir).toBeTypeOf("string");
	expect(parsedBundle.dashboard.panels).toEqual([
		{
			name: "test",
			title: "Test Panel",
			width: 1,
			headerColor: "#525F78",
			path: testDirPath(
				"fixtures/bundle-parser/good-bundle/dashboard/panel.html",
				true,
			),
			file: "panel.html",
			html:
				"<!DOCTYPE html><html><head></head>\n<body>\n\t<p>This is a test panel!</p>\n\t<script>" +
				"\n\t\twindow.parent.dashboardApi = window.nodecg;\n\t</script>\n</body></html>",
			dialog: false,
			bundleName: "good-bundle",
			workspace: "default",
			fullbleed: false,
		},
		{
			name: "test-workspace-panel",
			title: "Test Workspace Panel",
			width: 1,
			headerColor: "#ffffff",
			path: testDirPath(
				"fixtures/bundle-parser/good-bundle/dashboard/workspace-panel.html",
				true,
			),
			file: "workspace-panel.html",
			html:
				"<!DOCTYPE html><html><head></head>\n<body>\n\t<p>This is a test panel that goes into a test " +
				"workspace!</p>\n</body></html>",
			dialog: false,
			bundleName: "good-bundle",
			workspace: "foo",
			fullbleed: false,
		},
		{
			name: "test-fullbleed-panel",
			title: "Test Fullbleed Panel",
			headerColor: "#525F78",
			path: testDirPath(
				"fixtures/bundle-parser/good-bundle/dashboard/fullbleed-panel.html",
				true,
			),
			file: "fullbleed-panel.html",
			html: "<!DOCTYPE html><html><head></head>\n<body>\n\t<p>This is a test fullbleed panel!</p>\n</body></html>",
			dialog: false,
			bundleName: "good-bundle",
			fullbleed: true,
			workspace: "default",
		},
		{
			name: "test-dialog",
			title: "Test Dialog",
			width: 3,
			headerColor: "#333222",
			path: testDirPath(
				"fixtures/bundle-parser/good-bundle/dashboard/dialog.html",
				true,
			),
			file: "dialog.html",
			html: "<!DOCTYPE html><html><head></head>\n<body>\n\t<p>This is a test dialog!</p>\n</body></html>",
			dialog: true,
			dialogButtons: undefined,
			bundleName: "good-bundle",
			fullbleed: false,
		},
	]);

	expect(Array.isArray(parsedBundle.graphics)).toBe(true);
	expect(parsedBundle.hasExtension).toBe(true);
	expect(parsedBundle.soundCues).toMatchInlineSnapshot(`
		[
		  {
		    "assignable": true,
		    "name": "name-only",
		  },
		  {
		    "assignable": true,
		    "defaultVolume": 80,
		    "name": "default-volume",
		  },
		  {
		    "assignable": false,
		    "name": "non-assignable",
		  },
		  {
		    "assignable": true,
		    "defaultFile": "../default-file.ogg",
		    "name": "default-file",
		  },
		]
	`);
});

test('should error when "nodecg.compatibleRange" is not a valid semver range', () => {
	expect(
		parseBundle.bind(
			parseBundle,
			testDirPath("fixtures/bundle-parser/no-compatible-range"),
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: no-compatible-range's package.json does not have a valid "nodecg.compatibleRange" property.]`,
	);
});

test('should error when both "extension.js" and a directory named "extension" exist', () => {
	expect(
		parseBundle.bind(
			parseBundle,
			testDirPath("fixtures/bundle-parser/double-extension"),
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: double-extension has both "extension.js" and a folder named "extension". There can only be one of these, not both.]`,
	);
});

test('should error when "extension" exists and it is not a directory', () => {
	expect(
		parseBundle.bind(
			parseBundle,
			testDirPath("fixtures/bundle-parser/illegal-extension"),
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: illegal-extension has an illegal file named "extension" in its root. Either rename it to "extension.js", or make a directory named "extension"]`,
	);
});
