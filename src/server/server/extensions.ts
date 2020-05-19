// Native
import { EventEmitter } from 'events';
import path from 'path';

// Packages
import semver from 'semver';
import * as Sentry from '@sentry/node';

// Ours
import extensionApiClassFactory from '../api.server';
import createLogger from '../logger';
import { Replicator } from '../replicant';
import { RootNS } from '../../types/socket-protocol';
import BundleManager from '../bundle-manager';
import { NodeCG } from '../../types/nodecg';

const log = createLogger('nodecg/lib/server/extensions');

export default class ExtensionManager extends EventEmitter {
	readonly extensions: { [k: string]: unknown } = {};

	private readonly _satisfiedDepNames = new WeakMap<NodeCG.Bundle, string[]>();

	private readonly _ExtensionApi: ReturnType<typeof extensionApiClassFactory>;

	private readonly _bundleManager: BundleManager;

	constructor(io: RootNS, bundleManager: BundleManager, replicator: Replicator, mount: NodeCG.Middleware) {
		super();

		log.trace('Starting extension mounting');
		this._bundleManager = bundleManager;
		this._ExtensionApi = extensionApiClassFactory(io, replicator, this.extensions, mount);

		// Prevent us from messing with other listeners of this event
		const allBundles = bundleManager.all();

		// Track which bundles we know are fully loaded (extension and all)
		const fullyLoaded = [];

		while (allBundles.length > 0) {
			const startLen = allBundles.length;
			for (let i = 0; i < startLen; i++) {
				// If this bundle has no dependencies, load it and remove it from the list
				if (!allBundles[i].bundleDependencies) {
					log.debug('Bundle %s has no dependencies', allBundles[i].name);

					if (allBundles[i].hasExtension) {
						this._loadExtension(allBundles[i]);
					}

					fullyLoaded.push(allBundles[i]);
					allBundles.splice(i, 1);
					break;
				}

				// If this bundle has dependencies, and all of them are satisfied, load it and remove it from the list
				if (this._bundleDepsSatisfied(allBundles[i], fullyLoaded)) {
					log.debug('Bundle %s has extension with satisfied dependencies', allBundles[i].name);

					if (allBundles[i].hasExtension) {
						this._loadExtension(allBundles[i]);
					}

					fullyLoaded.push(allBundles[i]);
					allBundles.splice(i, 1);
					break;
				}
			}

			const endLen = allBundles.length;
			if (startLen === endLen) {
				// Any bundles left over must have had unsatisfied dependencies.
				// Print a warning about each bundle, and what its unsatisfied deps were.
				// Then, unload the bundle.
				allBundles.forEach(bundle => {
					const unsatisfiedDeps = [];

					for (const dep in bundle.bundleDependencies) {
						/* istanbul ignore if */
						if (!{}.hasOwnProperty.call(bundle.bundleDependencies, dep)) {
							continue;
						}

						/* istanbul ignore if */
						const satisfied = this._satisfiedDepNames.get(bundle);
						if (satisfied?.includes(dep)) {
							continue;
						}

						unsatisfiedDeps.push(`${dep}@${bundle.bundleDependencies[dep]}`);
					}

					log.error(
						'Bundle "%s" can not be loaded, as it has unsatisfied dependencies:\n',
						bundle.name,
						unsatisfiedDeps.join(', '),
					);
					bundleManager.remove(bundle.name);
				});

				log.error('%d bundle(s) can not be loaded because they have unsatisfied dependencies', endLen);
				break;
			}
		}

		log.trace('Completed extension mounting');
	}

	private _loadExtension(bundle: NodeCG.Bundle): void {
		const ExtensionApi = this._ExtensionApi;
		const extPath = path.join(bundle.dir, 'extension');
		try {
			/* eslint-disable @typescript-eslint/no-var-requires */
			const extension = require(extPath)(new ExtensionApi(bundle));
			/* eslint-enable @typescript-eslint/no-var-requires */
			log.info('Mounted %s extension', bundle.name);
			this.extensions[bundle.name] = extension;
		} catch (err) {
			this._bundleManager.remove(bundle.name);
			log.warn('Failed to mount %s extension:\n', err?.stack ?? err);
			if (global.sentryEnabled) {
				err.message = `Failed to mount ${bundle.name} extension: ${(err?.message ?? err) as string}`;
				Sentry.captureException(err);
			}
		}
	}

	private _bundleDepsSatisfied(bundle: NodeCG.Bundle, loadedBundles: NodeCG.Bundle[]): boolean {
		const deps = bundle.bundleDependencies;
		if (!deps) {
			return true;
		}

		const unsatisfiedDepNames = Object.keys(deps);
		const arr = this._satisfiedDepNames.get(bundle)?.slice(0) ?? [];

		loadedBundles.forEach(loadedBundle => {
			// Find out if this loaded bundle is one of the dependencies of the bundle in question.
			// If so, check if the version loaded satisfies the dependency.
			const index = unsatisfiedDepNames.indexOf(loadedBundle.name);
			if (index > -1) {
				if (semver.satisfies(loadedBundle.version, deps[loadedBundle.name])) {
					arr.push(loadedBundle.name);
					unsatisfiedDepNames.splice(index, 1);
				}
			}
		});

		this._satisfiedDepNames.set(bundle, arr);
		return unsatisfiedDepNames.length === 0;
	}
}
