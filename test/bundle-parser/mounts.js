'use strict';

// Packages
const test = require('ava');

// Ours
const parseMounts = require('../../lib/bundle-parser/mounts');

test('returns an empty array if a bundle has no mounts', t => {
	t.deepEqual(parseMounts({}), []);
	t.deepEqual(parseMounts({mount: []}), []);
});

test('throws if a bundle\'s `nodecg.mount` property is defined, not an array', t => {
	const error = t.throws(() => {
		parseMounts({name: 'test-bundle', mount: 'foo'});
	});
	t.is(error.message, 'test-bundle has an invalid "nodecg.mount" property in its package.json, it must be an array');
});

test('throws when required properties are missing from a mount declaration', t => {
	const error = t.throws(() => {
		parseMounts({name: 'test-bundle', mount: [{}]});
	});
	t.true(error.message.includes('the following properties: directory, endpoint'));
});

test('removes trailing slashes from endpoints', t => {
	t.deepEqual(
		parseMounts({mount: [{directory: 'foo', endpoint: 'foo/'}]}),
		[{directory: 'foo', endpoint: 'foo'}]
	);
});
