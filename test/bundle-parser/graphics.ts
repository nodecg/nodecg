// Packages
import test from 'ava';

// Ours
import parseBundle from '../../src/server/bundle-parser';

test('when there is no "graphics" folder, assign an empty array to bundle.graphics', (t) => {
	const parsedBundle = parseBundle('./test/fixtures/bundle-parser/no-graphics');
	t.true(Array.isArray(parsedBundle.graphics));
	t.is(parsedBundle.graphics.length, 0);
});

test('when there is a "graphics" folder but no "graphics" property, throw an error', (t) => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/no-graphics-prop'));
	if (!error) return t.fail();
	return t.true(error.message.includes('no "nodecg.graphics" property was found'));
});

test('when there is a "graphics" property but no "graphics" folder, throw an error', (t) => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/no-graphics-folder'));
	if (!error) return t.fail();
	return t.true(error.message.includes('but no "graphics" folder'));
});

test('when critical properties are missing from the "graphics" property, throw an error explaining what is missing', (t) => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/missing-graphic-props'));
	if (!error) return t.fail();
	return t.true(error.message.includes('the following properties: file, width, height'));
});

test('when two graphics have the same file, throw an error', (t) => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/dupe-graphic-file'));
	if (!error) return t.fail();
	return t.true(error.message.includes('has the same file as another graphic'));
});
