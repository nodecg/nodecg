import path from "node:path";

import { describe, expect, test } from "vitest";

import { recursivelyFindFileInNodeModules } from ".";

describe("recursivelyFindFileInNodeModules", () => {
	test("should find existing file in current node_modules", () => {
		const result = recursivelyFindFileInNodeModules(
			path.join(__dirname, "fixtures/node_modules/bar/node_modules/bar"),
			path.join(__dirname, "fixtures/node_modules"),
			"bar/bar",
		);
		expect(result).toBe(
			path.join(__dirname, "fixtures/node_modules/bar/node_modules/bar/bar"),
		);
	});

	test("should find existing file in parent node_modules", () => {
		const result = recursivelyFindFileInNodeModules(
			path.join(__dirname, "fixtures/node_modules/bar/node_modules/foo"),
			path.join(__dirname, "fixtures/node_modules"),
			"foo/foo",
		);
		expect(result).toBe(path.join(__dirname, "fixtures/node_modules/foo/foo"));
	});

	test("should return undefined for non-existing file", () => {
		const result = recursivelyFindFileInNodeModules(
			path.join(__dirname, "fixtures/node_modules/bar/node_modules/foo"),
			path.join(__dirname, "fixtures/node_modules"),
			"foo/bar",
		);
		expect(result).toBe(undefined);
	});

	test("should return undefined for node_modules outside of root", () => {
		const result = recursivelyFindFileInNodeModules(
			path.join(__dirname, "fixtures/node_modules/bar/node_modules/foo"),
			path.join(__dirname, "fixtures/node_modules/bar/node_modules"),
			"../foo/foo",
		);
		expect(result).toBe(undefined);
	});
});
