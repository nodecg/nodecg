import { expect, test } from "vitest";

import { parseAssets } from "../../src/server/bundle-parser/assets";

test("should return the validated assetCategories", () => {
	const categories = [
		{ name: "cat1", title: "Cat1" },
		{ name: "cat2", title: "Cat2", allowedTypes: ["mp4"] },
	];
	expect(
		parseAssets({ name: "test-bundle", assetCategories: categories }),
	).toEqual(categories);
});

test("should return an empty array when pkg.nodecg.assetCategories is falsey", () => {
	expect(parseAssets({ name: "test-bundle" })).toEqual([]);
});

test("should throw an error when pkg.nodecg.assetCategories is not an Array", () => {
	expect(() =>
		parseAssets({
			name: "test-bundle",
			// @ts-expect-error
			assetCategories: "foo",
		}),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: test-bundle's nodecg.assetCategories is not an Array]`,
	);
});

test("should throw an error when an assetCategory lacks a name", () => {
	expect(() =>
		parseAssets({
			name: "test-bundle",
			// @ts-expect-error
			assetCategories: [{}],
		}),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: nodecg.assetCategories[0] in bundle test-bundle lacks a "name" property]`,
	);
});

test("should throw an error when an assetCategory lacks a title", () => {
	expect(() =>
		parseAssets({
			name: "test-bundle",
			// @ts-expect-error
			assetCategories: [{ name: "category" }],
		}),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: nodecg.assetCategories[0] in bundle test-bundle lacks a "title" property]`,
	);
});

test("should throw an error when an assetCategory's allowedTypes isn't an array", () => {
	expect(() =>
		parseAssets({
			name: "test-bundle",
			assetCategories: [
				{
					name: "category",
					title: "Category",
					// @ts-expect-error
					allowedTypes: "foo",
				},
			],
		}),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: nodecg.assetCategories[0].allowedTypes in bundle test-bundle is not an Array]`,
	);
});

test('should throw an error when an assetCategory is named "sounds"', () => {
	expect(() =>
		parseAssets({
			name: "test-bundle",
			// @ts-expect-error
			assetCategories: [{ name: "Sounds" }],
		}),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: "sounds" is a reserved assetCategory name. Please change nodecg.assetCategories[0].name in bundle test-bundle]`,
	);
});
