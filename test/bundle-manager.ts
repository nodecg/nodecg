// Native
import fs from 'fs';
import path from 'path';
import os from 'os';

// Packages
import fse from 'fs-extra';
import tmp from 'tmp-promise';
import test from 'ava';

// Ours
import type BundleManagerTypeOnly from '../src/server/bundle-manager';
import { sleep } from './helpers/utilities';

tmp.setGracefulCleanup();
const tempFolder = tmp.dirSync().name;

let bundleManager: BundleManagerTypeOnly;
test.before(async () => {
	process.env.NODECG_ROOT = tempFolder;
	fse.copySync('test/fixtures/bundle-manager', tempFolder);

	// The symlink test can't run on Windows unless run with admin privs.
	// For some reason, creating symlinks on Windows requires admin.
	if (os.platform() !== 'win32') {
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

	/**
	 * Delay import so that we have time to set process.env.NODECG_ROOT first.
	 */
	const { default: BundleManager } = await import('../src/server/bundle-manager');
	bundleManager = new BundleManager(
		[path.join(tempFolder, 'bundles'), path.join(tempFolder, 'custom-bundles')],
		path.join(tempFolder, 'cfg'),
		'0.7.0',
		nodecgConfig,
	);

	// Wait for Chokidar to finish its initial scan.
	await new Promise<void>((resolve, reject) => {
		let handled = false;
		const timeout = setTimeout(() => {
			if (handled) return;
			handled = true;
			reject(new Error('Timed out while waiting for the bundle manager to become ready.'));
		}, 15000);

		if (bundleManager.ready) {
			succeed();
		} else {
			bundleManager.once('ready', () => {
				succeed();
			});
		}

		function succeed() {
			if (handled) return;
			handled = true;
			clearTimeout(timeout);
			resolve();
		}
	});
});

test.after(() => {
	bundleManager._stopWatching();
});

test.serial('loader - should detect and load bundle configuration files', (t) => {
	let bundle = bundleManager.find('config-test-json');
	t.deepEqual(bundle?.config, { bundleConfig: true });
	bundle = bundleManager.find('config-test-yaml');
	t.deepEqual(bundle?.config, { bundleConfig: true });
	bundle = bundleManager.find('config-test-js');
	t.deepEqual(bundle?.config, { bundleConfig: true });
});

test.serial('loader - should not load bundles with a non-satisfactory nodecg.compatibleRange', (t) => {
	const bundle = bundleManager.find('incompatible-range');
	t.is(bundle, undefined);
});

test.serial('loader - should not load a bundle that has been disabled', (t) => {
	const bundle = bundleManager.find('test-disabled-bundle');
	t.is(bundle, undefined);
});

test.serial('loader - should not crash or load an invalid bundle', (t) => {
	const bundle = bundleManager.find('node_modules');
	t.is(bundle, undefined);
});

test.serial('loader - should detect and load bundle located in custom bundle paths', (t) => {
	const bundle = bundleManager.find('another-test-bundle');
	t.is(bundle?.name, 'another-test-bundle');
});

test.serial('watcher - should emit a change event when the manifest file changes', async (t) => {
	t.plan(1);

	// eslint-disable-next-line no-async-promise-executor
	await new Promise<void>(async (resolve) => {
		let handled = false;
		const manifest = JSON.parse(fs.readFileSync(`${tempFolder}/bundles/change-manifest/package.json`, 'utf8'));

		bundleManager.once('bundleChanged', (bundle) => {
			if (handled) return;
			handled = true;
			t.is(bundle.name, 'change-manifest');
			resolve();
		});

		bundleManager.once('invalidBundle', (bundle, error) => {
			if (handled) return;
			handled = true;
			t.fail(`Received an "invalid-bundle" event for bundle "${bundle.name}": ${error.message}`);
			resolve();
		});

		manifest._changed = true;
		await sleep(100);
		fs.writeFileSync(`${tempFolder}/bundles/change-manifest/package.json`, JSON.stringify(manifest), 'utf8');
	});
});

test.serial('watcher - should remove the bundle when the manifest file is renamed', async (t) => {
	t.plan(1);

	const promise = new Promise<void>((resolve) => {
		bundleManager.once('bundleRemoved', () => {
			const result = bundleManager.find('rename-manifest');
			t.is(result, undefined);
			resolve();
		});
	});

	fs.renameSync(
		`${tempFolder}/bundles/rename-manifest/package.json`,
		`${tempFolder}/bundles/rename-manifest/package.json.renamed`,
	);

	await promise;
});

test.serial('watcher - should emit a removed event when the manifest file is removed', async (t) => {
	t.plan(1);

	const promise = new Promise<void>((resolve) => {
		bundleManager.once('bundleRemoved', () => {
			const result = bundleManager.find('remove-manifest');
			t.is(result, undefined);
			resolve();
		});
	});

	fs.unlinkSync(`${tempFolder}/bundles/remove-manifest/package.json`);

	await promise;
});

test.serial('watcher - should emit a change event when a panel HTML file changes', async (t) => {
	t.plan(1);

	const promise = new Promise<void>((resolve) => {
		bundleManager.once('bundleChanged', (bundle) => {
			t.is(bundle.name, 'change-panel');
			resolve();
		});
	});

	const panelPath = `${tempFolder}/bundles/change-panel/dashboard/panel.html`;
	let panel = fs.readFileSync(panelPath, 'utf8');
	panel += '\n';
	fs.writeFileSync(panelPath, panel);

	await promise;
});

if (os.platform() !== 'win32') {
	// This can't be tested on Windows unless run with admin privs.
	// For some reason, creating symlinks on Windows requires admin.
	test.serial('watcher - should detect panel HTML file changes when the bundle is symlinked', async (t) => {
		t.plan(1);

		const promise = new Promise<void>((resolve) => {
			bundleManager.once('bundleChanged', (bundle) => {
				t.is(bundle.name, 'change-panel-symlink');
				resolve();
			});
		});

		const panelPath = `${tempFolder}/bundles/change-panel-symlink/dashboard/panel.html`;
		let panel = fs.readFileSync(panelPath, 'utf8');
		panel += '\n';
		fs.writeFileSync(panelPath, panel);

		await promise;
	});
}

test.serial("watcher - should reload the bundle's config when the bundle is reloaded due to a change", async (t) => {
	t.plan(2);

	const manifest = JSON.parse(fs.readFileSync(`${tempFolder}/bundles/change-config/package.json`, 'utf8'));
	const config = JSON.parse(fs.readFileSync(`${tempFolder}/cfg/change-config.json`, 'utf8'));

	const promise = new Promise<void>((resolve) => {
		bundleManager.once('bundleChanged', (bundle) => {
			t.is(bundle.name, 'change-config');
			t.deepEqual(bundle.config, {
				bundleConfig: true,
				_changed: true,
			});
			resolve();
		});
	});

	config._changed = true;
	manifest._changed = true;
	fs.writeFileSync(`${tempFolder}/bundles/change-config/package.json`, JSON.stringify(manifest));
	fs.writeFileSync(`${tempFolder}/cfg/change-config.json`, JSON.stringify(config));

	await promise;
});

test.serial('watcher - should emit an `invalidBundle` error when a panel HTML file is removed', async (t) => {
	t.plan(2);

	const promise = new Promise<void>((resolve) => {
		bundleManager.once('invalidBundle', (bundle, error) => {
			t.is(bundle.name, 'remove-panel');
			t.is(error.message, 'Panel file "panel.html" in bundle "remove-panel" does not exist.');
			resolve();
		});
	});

	fs.unlinkSync(`${tempFolder}/bundles/remove-panel/dashboard/panel.html`);

	await promise;
});

test.serial('watcher - should emit an `invalidBundle` error when the manifest becomes invalid', async (t) => {
	t.plan(2);

	const promise = new Promise<void>((resolve) => {
		bundleManager.once('invalidBundle', (bundle, error) => {
			t.is(bundle.name, 'invalid-manifest');
			t.is(
				error.message,
				`${path.join(
					tempFolder,
					'bundles/invalid-manifest/package.json',
				)} is not valid JSON, please check it against a validator such as jsonlint.com`,
			);
			resolve();
		});
	});

	fs.writeFileSync(`${tempFolder}/bundles/invalid-manifest/package.json`, 'invalid-manifest');

	await promise;
});
