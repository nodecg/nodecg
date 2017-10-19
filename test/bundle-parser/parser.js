'use strict';

// Native
const path = require('path');

// Packages
const test = require('ava');

// Ours
const parseBundle = require('../../lib/bundle-parser');

test('should error when package.json does not exist', t => {
	const error = t.throws(parseBundle.bind(parseBundle, './test'));
	t.true(error.message.includes('does not contain a package.json!'));
});

test('should error when package.json has no "nodecg" property', t => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/no-nodecg-prop'));
	t.true(error.message.includes('lacks a "nodecg" property, and therefore cannot be parsed'));
});

test('should error when package.json is not valid JSON', t => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/invalid-manifest-json'));
	t.true(error.message.includes('package.json is not valid JSON'));
});

test('should return the expected data when "nodecg" property does exist', t => {
	const parsedBundle = parseBundle('./test/fixtures/bundle-parser/good-bundle');
	t.is(parsedBundle.name, 'good-bundle');
	t.is(parsedBundle.version, '0.0.1');
	t.is(parsedBundle.description, 'A test bundle');
	t.is(parsedBundle.homepage, 'http://github.com/nodecg');
	t.is(parsedBundle.author, 'Alex Van Camp <email@alexvan.camp>');
	t.is(parsedBundle.enableCustomCues, false);
	t.deepEqual(parsedBundle.contributors, ['Matt McNamara']);
	t.is(parsedBundle.license, 'MIT');
	t.is(parsedBundle.compatibleRange, '~0.7.0');
	t.is(parsedBundle.bundleDependencies, undefined);
	t.is(typeof parsedBundle.rawManifest, 'string');
	t.is(typeof parsedBundle.dir, 'string');
	t.deepEqual(parsedBundle.dependencies, {commander: '^2.6.0'});
	t.is(typeof parsedBundle.dashboard.dir, 'string');
	t.deepEqual(parsedBundle.dashboard.panels, [
		{
			name: 'test',
			title: 'Test Panel',
			width: 1,
			headerColor: '#9f9bbd',
			path: path.resolve(__dirname, '../fixtures/bundle-parser/good-bundle/dashboard/panel.html'),
			file: 'panel.html',
			html: '<!DOCTYPE html><html><head></head>\n<body>\n<p>This is a test panel!</p>\n<script>' +
			'\n    window.parent.dashboardApi = window.nodecg;\n</script>\n\n</body></html>',
			dialog: false,
			bundleName: 'good-bundle',
			workspace: 'default',
			fullbleed: false
		},
		{
			name: 'test-workspace-panel',
			title: 'Test Workspace Panel',
			width: 1,
			headerColor: '#ffffff',
			path: path.resolve(__dirname, '../fixtures/bundle-parser/good-bundle/dashboard/workspace-panel.html'),
			file: 'workspace-panel.html',
			html: '<!DOCTYPE html><html><head></head>\n<body>\n<p>This is a test panel that goes into a test ' +
			'workspace!</p>\n\n</body></html>',
			dialog: false,
			bundleName: 'good-bundle',
			workspace: 'foo',
			fullbleed: false
		},
		{
			name: 'test-fullbleed-panel',
			title: 'Test Fullbleed Panel',
			width: 1,
			headerColor: '#9f9bbd',
			path: path.resolve(__dirname, '../fixtures/bundle-parser/good-bundle/dashboard/fullbleed-panel.html'),
			file: 'fullbleed-panel.html',
			html: '<!DOCTYPE html><html><head></head>\n<body>\n<p>This is a test fullbleed panel!</p>\n\n</body></html>',
			dialog: false,
			bundleName: 'good-bundle',
			fullbleed: true,
			workspace: 'default'
		},
		{
			name: 'test-dialog',
			title: 'Test Dialog',
			width: 3,
			headerColor: '#333222',
			path: path.resolve(__dirname, '../fixtures/bundle-parser/good-bundle/dashboard/dialog.html'),
			file: 'dialog.html',
			html: '<!DOCTYPE html><html><head></head>\n<body>\n<p>This is a test dialog!</p>\n\n</body></html>',
			dialog: true,
			bundleName: 'good-bundle',
			fullbleed: false
		}
	]);
	t.true(Array.isArray(parsedBundle.graphics));
	t.true(parsedBundle.hasExtension);
	t.deepEqual(parsedBundle.soundCues, [{
		name: 'name-only',
		assignable: true
	}, {
		name: 'default-volume',
		defaultVolume: 80,
		assignable: true
	}, {
		name: 'non-assignable',
		assignable: false
	}, {
		name: 'default-file',
		defaultFile: '../default-file.ogg',
		assignable: true
	}]);
});

test('should error when "nodecg.compatibleRange" is not a valid semver range', t => {
	const error = t.throws(
		parseBundle.bind(
			parseBundle,
			'./test/fixtures/bundle-parser/no-compatible-range'
		),
		/does not have a valid "nodecg.compatibleRange"/
	);
	t.true(error.message.includes(''));
});

test('should error when both "extension.js" and a directory named "extension" exist', t => {
	const error = t.throws(
		parseBundle.bind(
			parseBundle,
			'./test/fixtures/bundle-parser/double-extension'
		),
		/has both "extension.js" and a folder named "extension"/
	);
	t.true(error.message.includes(''));
});

test('should error when "extension" exists and it is not a directory', t => {
	const error = t.throws(
		parseBundle.bind(
			parseBundle,
			'./test/fixtures/bundle-parser/illegal-extension'
		),
		/has an illegal file named "extension"/
	);
	t.true(error.message.includes(''));
});

test('should error when the bundle\'s folder name doesn\'t match its manifest name', t => {
	const error = t.throws(
		parseBundle.bind(
			parseBundle,
			'./test/fixtures/bundle-parser/bad-folder-name'
		),
		/Please rename it to "/
	);
	t.true(error.message.includes(''));
});
