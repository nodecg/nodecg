// Native
import path from 'path';

// Packages
import fs from 'fs-extra';
import chokidar from 'chokidar';
import debounce from 'lodash.debounce';
import semver from 'semver';
import { cosmiconfigSync as cosmiconfig } from 'cosmiconfig';

// Ours
import parseBundle from './bundle-parser';
import parseBundleGit from './bundle-parser/git';
import createLogger from './logger';
import type { NodeCG } from '../types/nodecg';
import { TypedEmitter } from '../shared/typed-emitter';

/**
 * Milliseconds
 */
const READY_WAIT_THRESHOLD = 1500;

// Start up the watcher, but don't watch any files yet.
// We'll add the files we want to watch later, in the init() method.
const watcher = chokidar.watch(
	[
		'!**/*___jb_*___', // Ignore temp files created by JetBrains IDEs
		'!**/node_modules/**', // Ignore node_modules folders
		'!**/bower_components/**', // Ignore bower_components folders
		'!**/*.lock', // Ignore lockfiles
	],
	{
		persistent: true,
		ignoreInitial: true,
		followSymlinks: true,
	},
);

const blacklistedBundleDirectories = ['node_modules', 'bower_components'];

const bundles: NodeCG.Bundle[] = [];
const log = createLogger('bundle-manager');
const hasChanged = new Set<string>();
let backoffTimer: NodeJS.Timeout | undefined;

type EventMap = {
	bundleRemoved: (bundleName: string) => void;
	gitChanged: (bundle: NodeCG.Bundle) => void;
	bundleChanged: (reparsedBundle: NodeCG.Bundle) => void;
	invalidBundle: (bundle: NodeCG.Bundle, error: Error) => void;
	ready: () => void;
};

export default class BundleManager extends TypedEmitter<EventMap> {
	bundles: NodeCG.Bundle[] = [];

	get ready() {
		return this._ready;
	}

	private _ready = false;
	private _canBeReady = false;

	private readonly _cfgPath: string;

	// This is on a debouncer to avoid false-positives that can happen when editing a manifest.
	private readonly _debouncedManifestDeletionCheck = debounce((bundleName, manifestPath) => {
		if (fs.existsSync(manifestPath)) {
			this.handleChange(bundleName);
		} else {
			log.debug('Processing removed event for', bundleName);
			log.info(
				"%s's package.json can no longer be found on disk, assuming the bundle has been deleted or moved",
				bundleName,
			);
			this.remove(bundleName);
			this.emit('bundleRemoved', bundleName);
		}
	}, 100);

	private readonly _debouncedGitChangeHandler = debounce((bundleName) => {
		const bundle = this.find(bundleName);
		if (!bundle) {
			return;
		}

		bundle.git = parseBundleGit(bundle.dir);
		this.emit('gitChanged', bundle);
	}, 250);

	constructor(bundlesPaths: string[], cfgPath: string, nodecgVersion: string, nodecgConfig: Record<string, any>) {
		super();

		this._cfgPath = cfgPath;

		bundlesPaths.forEach((bundlesPath) => {
			log.trace(`Loading bundles from ${bundlesPath}`);

			// Create the "bundles" dir if it does not exist.
			/* istanbul ignore if: We know this code works and testing it is tedious, so we don't bother to test it. */
			if (!fs.existsSync(bundlesPath)) {
				fs.mkdirpSync(bundlesPath);
			}

			/* istanbul ignore next */
			let lastAdd: number;
			watcher.on('add', (filePath) => {
				lastAdd = performance.now();
				const bundleName = extractBundleName(bundlesPath, filePath);

				// In theory, the bundle parser would have thrown an error long before this block would execute,
				// because in order for us to be adding a panel HTML file, that means that the file would have been missing,
				// which the parser does not allow and would throw an error for.
				// Just in case though, its here.
				if (this.isPanelHTMLFile(bundleName, filePath)) {
					this.handleChange(bundleName);
				} else if (isGitData(bundleName, filePath)) {
					this._debouncedGitChangeHandler(bundleName);
				}

				if (this._canBeReady && !this._ready) {
					const now = performance.now();
					const timeSinceLastAdd = now - lastAdd;
					if (timeSinceLastAdd > READY_WAIT_THRESHOLD) {
						this._ready = true;
						this.emit('ready');
					}

					lastAdd = now;
				}
			});

			watcher.on('change', (filePath) => {
				const bundleName = extractBundleName(bundlesPath, filePath);

				if (isManifest(bundleName, filePath) || this.isPanelHTMLFile(bundleName, filePath)) {
					this.handleChange(bundleName);
				} else if (isGitData(bundleName, filePath)) {
					this._debouncedGitChangeHandler(bundleName);
				}
			});

			watcher.on('unlink', (filePath) => {
				const bundleName = extractBundleName(bundlesPath, filePath);

				if (this.isPanelHTMLFile(bundleName, filePath)) {
					// This will cause NodeCG to crash, because the parser will throw an error due to
					// a panel's HTML file no longer being present.
					this.handleChange(bundleName);
				} else if (isManifest(bundleName, filePath)) {
					this._debouncedManifestDeletionCheck(bundleName, filePath);
				} else if (isGitData(bundleName, filePath)) {
					this._debouncedGitChangeHandler(bundleName);
				}
			});

			/* istanbul ignore next */
			watcher.on('error', (error) => {
				log.error(error.stack);
			});

			// Do an initial load of each bundle in the "bundles" folder.
			// During runtime, any changes to a bundle's "dashboard" folder will trigger a re-load of that bundle,
			// as will changes to its `package.json`.
			fs.readdirSync(bundlesPath).forEach((bundleFolderName) => {
				const bundlePath = path.join(bundlesPath, bundleFolderName);
				if (!fs.statSync(bundlePath).isDirectory()) {
					return;
				}

				// Prevent attempting to load unwanted directories. Those specified above and all dot-prefixed.
				if (blacklistedBundleDirectories.includes(bundleFolderName) || bundleFolderName.startsWith('.')) {
					return;
				}

				if (nodecgConfig?.bundles?.disabled?.includes(bundleFolderName)) {
					log.debug(`Not loading bundle ${bundleFolderName} as it is disabled in config`);
					return;
				}

				if (nodecgConfig?.bundles?.enabled && !nodecgConfig.bundles.enabled.includes(bundleFolderName)) {
					log.debug(`Not loading bundle ${bundleFolderName} as it is not enabled in config`);
					return;
				}

				log.debug(`Loading bundle ${bundleFolderName}`);

				// Parse each bundle and push the result onto the bundles array
				const bundle = parseBundle(bundlePath, loadBundleCfg(cfgPath, bundleFolderName));

				// Check if the bundle is compatible with this version of NodeCG
				if (!semver.satisfies(nodecgVersion, bundle.compatibleRange)) {
					log.error(
						'%s requires NodeCG version %s, current version is %s',
						bundle.name,
						bundle.compatibleRange,
						nodecgVersion,
					);
					return;
				}

				bundles.push(bundle);

				// Use `chokidar` to watch for file changes within bundles.
				// Workaround for https://github.com/paulmillr/chokidar/issues/419
				// This workaround is necessary to fully support symlinks.
				// This is applied after the bundle has been validated and loaded.
				// Bundles that do not properly load upon startup are not recognized for updates.
				watcher.add([
					path.join(bundlePath, '.git'), // Watch `.git` directories.
					path.join(bundlePath, 'dashboard'), // Watch `dashboard` directories.
					path.join(bundlePath, 'package.json'), // Watch each bundle's `package.json`.
				]);

				this._canBeReady = true;
			});
		});
	}

	/**
	 * Returns a shallow-cloned array of all currently active bundles.
	 * @returns {Array.<Object>}
	 */
	all(): NodeCG.Bundle[] {
		return bundles.slice(0);
	}

	/**
	 * Returns the bundle with the given name. undefined if not found.
	 * @param name {String} - The name of the bundle to find.
	 * @returns {Object|undefined}
	 */
	find(name: string): NodeCG.Bundle | undefined {
		return bundles.find((b) => b.name === name);
	}

	/**
	 * Adds a bundle to the internal list, replacing any existing bundle with the same name.
	 * @param bundle {Object}
	 */
	add(bundle: NodeCG.Bundle): void {
		/* istanbul ignore if: Again, it shouldn't be possible for "bundle" to be undefined, but just in case... */
		if (!bundle) {
			return;
		}

		// Remove any existing bundles with this name
		if (this.find(bundle.name)) {
			this.remove(bundle.name);
		}

		bundles.push(bundle);
	}

	/**
	 * Removes a bundle with the given name from the internal list. Does nothing if no match found.
	 * @param bundleName {String}
	 */
	remove(bundleName: string): void {
		const len = bundles.length;
		for (let i = 0; i < len; i++) {
			// TODO: this check shouldn't have to happen, idk why things in this array can sometimes be undefined
			if (!bundles[i]) {
				continue;
			}

			if (bundles[i].name === bundleName) {
				bundles.splice(i, 1);
			}
		}
	}

	handleChange(bundleName: string): void {
		setTimeout(() => {
			this._handleChange(bundleName);
		}, 100);
	}

	/**
	 * Resets the backoff timer used to avoid event thrashing when many files change rapidly.
	 */
	resetBackoffTimer(): void {
		clearTimeout(backoffTimer as any); // Typedefs for clearTimeout are always wonky
		backoffTimer = setTimeout(() => {
			backoffTimer = undefined;
			for (const bundleName of hasChanged) {
				log.debug('Backoff finished, emitting change event for', bundleName);
				this.handleChange(bundleName);
			}

			hasChanged.clear();
		}, 500);
	}

	/**
	 * Checks if a given path is a panel HTML file of a given bundle.
	 * @param bundleName {String}
	 * @param filePath {String}
	 * @returns {Boolean}
	 * @private
	 */
	isPanelHTMLFile(bundleName: string, filePath: string): boolean {
		const bundle = this.find(bundleName);
		if (bundle) {
			return bundle.dashboard.panels.some((panel) => panel.path.endsWith(filePath));
		}

		return false;
	}

	/**
	 * Only used by tests.
	 */
	_stopWatching(): void {
		void watcher.close();
	}

	private _handleChange(bundleName: string): void {
		const bundle = this.find(bundleName);

		/* istanbul ignore if: It's rare for `bundle` to be undefined here, but it can happen when using black/whitelisting. */
		if (!bundle) {
			return;
		}

		if (backoffTimer) {
			log.debug('Backoff active, delaying processing of change detected in', bundleName);
			hasChanged.add(bundleName);
			this.resetBackoffTimer();
		} else {
			log.debug('Processing change event for', bundleName);
			this.resetBackoffTimer();

			try {
				const reparsedBundle = parseBundle(bundle.dir, loadBundleCfg(this._cfgPath, bundle.name));
				this.add(reparsedBundle);
				this.emit('bundleChanged', reparsedBundle);
				// eslint-disable-next-line @typescript-eslint/no-implicit-any-catch
			} catch (error: any) {
				log.warn('Unable to handle the bundle "%s" change:\n%s', bundleName, error.stack);
				this.emit('invalidBundle', bundle, error);
			}
		}
	}
}

/**
 * Returns the name of a bundle that owns a given path.
 * @param filePath {String} - The path of the file to extract a bundle name from.
 * @returns {String} - The name of the bundle that owns this path.
 * @private
 */
function extractBundleName(bundlesPath: string, filePath: string): string {
	return filePath.replace(bundlesPath, '').split(path.sep)[1];
}

/**
 * Checks if a given path is the manifest file for a given bundle.
 * @param bundleName {String}
 * @param filePath {String}
 * @returns {Boolean}
 * @private
 */
function isManifest(bundleName: string, filePath: string): boolean {
	return path.dirname(filePath).endsWith(bundleName) && path.basename(filePath) === 'package.json';
}

/**
 * Checks if a given path is in the .git dir of a bundle.
 * @param bundleName {String}
 * @param filePath {String}
 * @returns {Boolean}
 * @private
 */
function isGitData(bundleName: string, filePath: string): boolean {
	const regex = new RegExp(`${bundleName}${'\\'}${path.sep}${'\\'}.git`);
	return regex.test(filePath);
}

/**
 * Determines which config file to use for a bundle.
 */
function loadBundleCfg(cfgDir: string, bundleName: string): NodeCG.Bundle.UnknownConfig | undefined {
	try {
		const cc = cosmiconfig('nodecg', {
			searchPlaces: [
				`${bundleName}.json`,
				`${bundleName}.yaml`,
				`${bundleName}.yml`,
				`${bundleName}.js`,
				`${bundleName}.config.js`,
			],
			stopDir: cfgDir,
		});
		const result = cc.search(cfgDir);
		return result?.config;
	} catch (_: unknown) {
		throw new Error(
			`Config for bundle "${bundleName}" could not be read. Ensure that it is valid JSON, YAML, or CommonJS.`,
		);
	}
}
