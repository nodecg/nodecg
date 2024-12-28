import { expect, test } from "vitest";

import { parseMounts } from "../../src/server/bundle-parser/mounts";

test("returns an empty array if a bundle has no mounts", () => {
	expect(parseMounts({ name: "test-bundle" })).toEqual([]);
	expect(parseMounts({ name: "test-bundle", mount: [] })).toEqual([]);
});

test("throws if a bundle's `nodecg.mount` property is defined, not an array", () => {
	expect(() => {
		// @ts-expect-error
		parseMounts({ name: "test-bundle", mount: "foo" });
	}).toThrowErrorMatchingInlineSnapshot(
		`[Error: test-bundle has an invalid "nodecg.mount" property in its package.json, it must be an array]`,
	);
});

test("throws when required properties are missing from a mount declaration", () => {
	expect(() => {
		// @ts-expect-error
		parseMounts({ name: "test-bundle", mount: [{}] });
	}).toThrowErrorMatchingInlineSnapshot(
		`[Error: Mount #0 could not be parsed as it is missing the following properties: directory, endpoint]`,
	);
});

test("removes trailing slashes from endpoints", () => {
	expect(
		parseMounts({
			name: "test-bundle",
			mount: [{ directory: "foo", endpoint: "foo/" }],
		}),
	).toEqual([{ directory: "foo", endpoint: "foo" }]);
});
