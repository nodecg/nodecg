// Packages
import test from 'ava';

// Ours
import parseAssets from '../../build/server/bundle-parser/assets';

test('should return the validated assetCategories', t => {
	const categories = [
		{
			name: 'cat1',
			title: 'Cat1',
		},
		{
			name: 'cat2',
			title: 'Cat2',
			allowedTypes: ['mp4'],
		},
	];

	t.deepEqual(parseAssets({ name: 'test-bundle', assetCategories: categories }), categories);
});

test('should return an empty array when pkg.nodecg.assetCategories is falsey', t => {
	t.deepEqual(parseAssets({ name: 'test-bundle' }), []);
});

test('should throw an error when pkg.nodecg.assetCategories is not an Array', t => {
	const error = t.throws(() => {
		return parseAssets({
			name: 'test-bundle',
			// TODO: change to @ts-expect-error once TS 3.9 is out
			// @ts-ignore
			assetCategories: 'foo',
		});
	});

	t.is(error.message, "test-bundle's nodecg.assetCategories is not an Array");
});

test('should throw an error when an assetCategory lacks a name', t => {
	const error = t.throws(() => {
		return parseAssets({
			name: 'test-bundle',
			// TODO: change to @ts-expect-error once TS 3.9 is out
			// @ts-ignore
			assetCategories: [{}],
		});
	});

	t.is(error.message, 'nodecg.assetCategories[0] in bundle test-bundle lacks a "name" property');
});

test('should throw an error when an assetCategory lacks a title', t => {
	const error = t.throws(() => {
		return parseAssets({
			name: 'test-bundle',
			// TODO: change to @ts-expect-error once TS 3.9 is out
			// @ts-ignore
			assetCategories: [{ name: 'category' }],
		});
	});

	t.is(error.message, 'nodecg.assetCategories[0] in bundle test-bundle lacks a "title" property');
});

test("should throw an error when an assetCategory's allowedTypes isn't an array", t => {
	const error = t.throws(() => {
		return parseAssets({
			name: 'test-bundle',
			assetCategories: [
				{
					name: 'category',
					title: 'Category',
					// TODO: change to @ts-expect-error once TS 3.9 is out
					// @ts-ignore
					allowedTypes: 'foo',
				},
			],
		});
	});

	t.is(error.message, 'nodecg.assetCategories[0].allowedTypes in bundle test-bundle is not an Array');
});

test('should throw an error when an assetCategory is named "sounds"', t => {
	const error = t.throws(() => {
		return parseAssets({
			name: 'test-bundle',
			// TODO: change to @ts-expect-error once TS 3.9 is out
			// @ts-ignore
			assetCategories: [{ name: 'Sounds' }],
		});
	});

	t.is(
		error.message,
		'"sounds" is a reserved assetCategory name. ' +
			'Please change nodecg.assetCategories[0].name in bundle test-bundle',
	);
});
