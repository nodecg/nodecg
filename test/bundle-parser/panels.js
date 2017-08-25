'use strict';

// Packages
const test = require('ava');

// Ours
const parseBundle = require('../../lib/bundle-parser');

test('when there is no "dashboard" folder, assign an empty array to bundle.dashboard.panels', t => {
	const parsedBundle = parseBundle('./test/fixtures/bundle-parser/no-panels');
	t.true(Array.isArray(parsedBundle.dashboard.panels));
	t.is(parsedBundle.dashboard.panels.length, 0);
});

test('when there is a "dashboard" folder but no "dashboardPanels" property, throw an error', t => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/no-panels-prop'));
	t.true(error.message.includes('no "nodecg.dashboardPanels" property was found'));
});

test('when there is a "dashboardPanels" property but no "dashboard" folder, throw an error', t => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/no-dashboard-folder'));
	t.true(error.message.includes('but no "dashboard" folder'));
});

test('when critical properties are missing from the "dashboardPanels" property, throw an error explaining what is missing', t => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/missing-panel-props'));
	t.true(error.message.includes('the following properties: name, title, file'));
});

test('when two panels have the same name, throw an error', t => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/dupe-panel-name'));
	t.true(error.message.includes('has the same name as another panel'));
});

test('when a panel\'s file has no <!DOCTYPE>, throw an error', t => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/no-doctype'));
	t.true(error.message.includes('has no DOCTYPE'));
});

test('when a panel\'s file does not exist, throw an error', t => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/non-existant-panel'));
	t.true(error.message.includes(' does not exist'));
});

test('when a dialog has a workspace, throw an error', t => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/dialog-workspace'));
	t.true(error.message.includes('Dialogs don\'t get put into workspaces'));
});

test('when a dialog is fullbleed, throw an error', t => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/dialog-fullbleed'));
	t.true(error.message.includes('Fullbleed panels cannot be dialogs'));
});

test('when a fullbleed panel has a workspace, throw an error', t => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/fullbleed-workspace'));
	t.true(error.message.includes('Fullbleed panels are not allowed to define a workspace'));
});

test('when a fullbleed panel has a defined width, throw an error', t => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/fullbleed-width'));
	t.true(error.message.includes('Fullbleed panels have their width set based on the'));
});

test('when a panel has a workspace that begins with __nodecg, throw an error', t => {
	const error = t.throws(parseBundle.bind(parseBundle, './test/fixtures/bundle-parser/reserved-workspace__nodecg'));
	t.true(error.message.includes('whose name begins with __nodecg, which is a reserved string'));
});
