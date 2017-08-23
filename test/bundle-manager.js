'use strict';

// Native
const fs = require('fs');

// Packages
const rimraf = require('rimraf');
const test = require('ava');
const wrench = require('wrench');

// Ours
const Logger = require('../lib/logger/server')({console: {enabled: true}});

let bundleManager;
test.cb.before(t => {
	if (!fs.existsSync('_workingTest')) {
		fs.mkdirSync('_workingTest');
	}

	wrench.copyDirSyncRecursive('test/fixtures/bundle-manager', '_workingTest', {forceDelete: true});

	const nodecgConfig = {
		bundles: {
			disabled: [
				'test-disabled-bundle'
			]
		}
	};

	bundleManager = require('../lib/bundle-manager');
	bundleManager.init('_workingTest', '0.7.0', nodecgConfig, Logger);

	// Needs a little extra wait time for some reason.
	// Without this, tests randomly fail.
	setTimeout(() => {
		t.end();
	}, 100);
});

test.cb.after(t => {
	bundleManager._stopWatching();
	process.nextTick(() => {
		rimraf('_workingTest', () => {
			t.end();
		});
	});
});

test.serial('loader - should detect and load bundle configuration files', t => {
	const bundle = bundleManager.find('config-test');
	t.deepEqual(bundle.config, {bundleConfig: true});
});

test.serial('loader - should not load bundles with a non-satisfactory nodecg.compatibleRange', t => {
	const bundle = bundleManager.find('incompatible-range');
	t.is(bundle, undefined);
});

test.serial('loader - should not load a bundle that has been disabled', t => {
	const bundle = bundleManager.find('test-disabled-bundle');
	t.is(bundle, undefined);
});

test.cb.serial('watcher - hould emit a change event when the manifest file changes', t => {
	const manifest = JSON.parse(fs.readFileSync('_workingTest/bundles/change-manifest/package.json'));
	bundleManager.once('bundleChanged', bundle => {
		t.is(bundle.name, 'change-manifest');
		t.end();
	});

	manifest._changed = true;
	fs.writeFileSync('_workingTest/bundles/change-manifest/package.json', JSON.stringify(manifest));
});

test.cb.serial('watcher - should remove the bundle when the manifest file is renamed', t => {
	bundleManager.once('bundleRemoved', () => {
		const result = bundleManager.find('rename-manifest');
		t.is(result, undefined);
		t.end();
	});

	fs.renameSync('_workingTest/bundles/rename-manifest/package.json',
		'_workingTest/bundles/rename-manifest/package.json.renamed');
});

test.cb.serial('watcher - should emit a removed event when the manifest file is removed', t => {
	bundleManager.once('bundleRemoved', () => {
		const result = bundleManager.find('remove-manifest');
		t.is(result, undefined);
		t.end();
	});

	fs.unlinkSync('_workingTest/bundles/remove-manifest/package.json');
});

test.cb.serial('watcher - should emit a change event when a panel HTML file changes', t => {
	bundleManager.once('bundleChanged', bundle => {
		t.is(bundle.name, 'change-panel');
		t.end();
	});

	const panelPath = '_workingTest/bundles/change-panel/dashboard/panel.html';
	let panel = fs.readFileSync(panelPath);
	panel += '\n';
	fs.writeFileSync(panelPath, panel);
});

test.cb.serial('watcher - should detect panel HTML file changes when the bundle is symlinked', t => {
	bundleManager.once('bundleChanged', bundle => {
		t.is(bundle.name, 'change-panel-symlink');
		t.end();
	});

	const panelPath = '_workingTest/bundles/change-panel-symlink/dashboard/panel.html';
	let panel = fs.readFileSync(panelPath);
	panel += '\n';
	fs.writeFileSync(panelPath, panel);
});

test.cb.serial('watcher - should reload the bundle\'s config when the bundle is reloaded due to a change', t => {
	const manifest = JSON.parse(fs.readFileSync('_workingTest/bundles/change-config/package.json'));
	const config = JSON.parse(fs.readFileSync('_workingTest/cfg/change-config.json'));

	bundleManager.once('bundleChanged', bundle => {
		t.is(bundle.name, 'change-config');
		t.deepEqual(bundle.config, {
			bundleConfig: true,
			_changed: true
		});
		t.end();
	});

	config._changed = true;
	manifest._changed = true;
	fs.writeFileSync('_workingTest/bundles/change-config/package.json', JSON.stringify(manifest));
	fs.writeFileSync('_workingTest/cfg/change-config.json', JSON.stringify(config));
});

// This has to be the last test.
test.cb.serial('watcher - should produce an unhandled exception when a panel HTML file is removed', t => {
	// Remove Mocha's error listener
	const originalUncaughtExceptionListeners = process.listeners('uncaughtException');
	process.removeAllListeners('uncaughtException');

	// Add our own error listener to check for unhandled exceptions
	process.on('uncaughtException', err => {
		// Add the original error listeners again
		process.removeAllListeners('uncaughtException');
		for (let i = 0; i < originalUncaughtExceptionListeners.length; i += 1) {
			process.on('uncaughtException', originalUncaughtExceptionListeners[i]);
		}

		t.is(err.message, 'Panel file "panel.html" in bundle "remove-panel" does not exist.');
		t.end();
	});

	fs.unlinkSync('_workingTest/bundles/remove-panel/dashboard/panel.html');
});
