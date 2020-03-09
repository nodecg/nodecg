'use strict';

// Native
import * as fs from 'fs';
import * as path from 'path';

// Packages
import * as fse from 'fs-extra';
import * as temp from 'temp';
import * as test from 'ava';
const isWindows = require('is-windows');

// Ours
const Logger = require('../lib/logger/server')({ console: { enabled: true } });

const tempFolder = temp.mkdirSync();
temp.track(); // Automatically track and cleanup files at exit.

let bundleManager;
test.before.cb(t => {
	fse.copySync('test/fixtures/bundle-manager', tempFolder);

	// The symlink test can't run on Windows unless run with admin privs.
	// For some reason, creating symlinks on Windows requires admin.
	if (!isWindows()) {
		fs.symlinkSync(
			path.join(tempFolder, 'change-panel-symlink-target'),
			path.join(tempFolder, 'bundles/change-panel-symlink'),
		);
	}

	const nodecgConfig = {
		bundles: {
			disabled: ['test-disabled-bundle'],
		},
	};

	bundleManager = require('../lib/bundle-manager');
	bundleManager.init(
		[path.join(tempFolder, 'bundles'), path.join(tempFolder, 'custom-bundles')],
		path.join(tempFolder, 'cfg'),
		'0.7.0',
		nodecgConfig,
		Logger,
	);

	// Needs a little extra wait time for some reason.
	// Without this, tests randomly fail.
	setTimeout(() => {
		t.end();
	}, 100);
});

test.after(() => {
	bundleManager._stopWatching();
});

test.serial('loader - should detect and load bundle configuration files', t => {
	const bundle = bundleManager.find('config-test');
	t.deepEqual(bundle.config, { bundleConfig: true });
});

test.serial('loader - should not load bundles with a non-satisfactory nodecg.compatibleRange', t => {
	const bundle = bundleManager.find('incompatible-range');
	t.is(bundle, undefined);
});

test.serial('loader - should not load a bundle that has been disabled', t => {
	const bundle = bundleManager.find('test-disabled-bundle');
	t.is(bundle, undefined);
});

test.serial('loader - should not crash or load an invalid bundle', t => {
	const bundle = bundleManager.find('node_modules');
	t.is(bundle, undefined);
});

test.serial('loader - should detect and load bundle located in custom bundle paths', t => {
	const bundle = bundleManager.find('another-test-bundle');
	t.is(bundle.name, 'another-test-bundle');
});

test.serial.cb('watcher - hould emit a change event when the manifest file changes', t => {
	const manifest = JSON.parse(fs.readFileSync(`${tempFolder}/bundles/change-manifest/package.json`));
	bundleManager.once('bundleChanged', bundle => {
		t.is(bundle.name, 'change-manifest');
		t.end();
	});

	manifest._changed = true;
	fs.writeFileSync(`${tempFolder}/bundles/change-manifest/package.json`, JSON.stringify(manifest));
});

test.serial.cb('watcher - should remove the bundle when the manifest file is renamed', t => {
	bundleManager.once('bundleRemoved', () => {
		const result = bundleManager.find('rename-manifest');
		t.is(result, undefined);
		t.end();
	});

	fs.renameSync(
		`${tempFolder}/bundles/rename-manifest/package.json`,
		`${tempFolder}/bundles/rename-manifest/package.json.renamed`,
	);
});

test.serial.cb('watcher - should emit a removed event when the manifest file is removed', t => {
	bundleManager.once('bundleRemoved', () => {
		const result = bundleManager.find('remove-manifest');
		t.is(result, undefined);
		t.end();
	});

	fs.unlinkSync(`${tempFolder}/bundles/remove-manifest/package.json`);
});

test.serial.cb('watcher - should emit a change event when a panel HTML file changes', t => {
	bundleManager.once('bundleChanged', bundle => {
		t.is(bundle.name, 'change-panel');
		t.end();
	});

	const panelPath = `${tempFolder}/bundles/change-panel/dashboard/panel.html`;
	let panel = fs.readFileSync(panelPath);
	panel += '\n';
	fs.writeFileSync(panelPath, panel);
});

if (!isWindows()) {
	// This can't be tested on Windows unless run with admin privs.
	// For some reason, creating symlinks on Windows requires admin.
	test.serial.cb('watcher - should detect panel HTML file changes when the bundle is symlinked', t => {
		bundleManager.once('bundleChanged', bundle => {
			t.is(bundle.name, 'change-panel-symlink');
			t.end();
		});

		const panelPath = `${tempFolder}/bundles/change-panel-symlink/dashboard/panel.html`;
		let panel = fs.readFileSync(panelPath);
		panel += '\n';
		fs.writeFileSync(panelPath, panel);
	});
}

test.serial.cb("watcher - should reload the bundle's config when the bundle is reloaded due to a change", t => {
	const manifest = JSON.parse(fs.readFileSync(`${tempFolder}/bundles/change-config/package.json`));
	const config = JSON.parse(fs.readFileSync(`${tempFolder}/cfg/change-config.json`));

	bundleManager.once('bundleChanged', bundle => {
		t.is(bundle.name, 'change-config');
		t.deepEqual(bundle.config, {
			bundleConfig: true,
			_changed: true,
		});
		t.end();
	});

	config._changed = true;
	manifest._changed = true;
	fs.writeFileSync(`${tempFolder}/bundles/change-config/package.json`, JSON.stringify(manifest));
	fs.writeFileSync(`${tempFolder}/cfg/change-config.json`, JSON.stringify(config));
});

test.serial.cb('watcher - should emit an `invalidBundle` error when a panel HTML file is removed', t => {
	bundleManager.once('invalidBundle', (bundle, error) => {
		t.is(bundle.name, 'remove-panel');
		t.is(error.message, 'Panel file "panel.html" in bundle "remove-panel" does not exist.');
		t.end();
	});

	fs.unlinkSync(`${tempFolder}/bundles/remove-panel/dashboard/panel.html`);
});

test.serial.cb('watcher - should emit an `invalidBundle` error when the manifest becomes invalid', t => {
	bundleManager.once('invalidBundle', (bundle, error) => {
		t.is(bundle.name, 'invalid-manifest');
		t.is(
			error.message,
			`${path.join(
				tempFolder,
				'bundles/invalid-manifest/package.json',
			)} is not valid JSON, please check it against a validator such as jsonlint.com`,
		);
		t.end();
	});

	fs.writeFileSync(`${tempFolder}/bundles/invalid-manifest/package.json`, 'invalid-manifest');
});
