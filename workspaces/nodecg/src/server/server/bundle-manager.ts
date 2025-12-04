import fs from "node:fs";
import path from "node:path";

import { isLegacyProject, rootPaths } from "@nodecg/internal-util";
import { cosmiconfigSync as cosmiconfig } from "cosmiconfig";
import {
	Chunk,
	Console,
	Data,
	Deferred,
	Duration,
	Effect,
	GroupBy,
	Match,
	Option,
	PubSub,
	Stream,
} from "effect";
import semver from "semver";

import type { NodeCG } from "../../types/nodecg";
import {
	getWatcher,
	listenToAdd,
	listenToChange,
	listenToError,
	listenToUnlink,
} from "../_effect/chokidar.ts";
import { NodecgConfig } from "../_effect/nodecg-config.ts";
import { NodecgPackageJson } from "../_effect/nodecg-package-json.ts";
import { parseBundle } from "../bundle-parser";
import { parseGit as parseBundleGit } from "../bundle-parser/git.ts";
import { createLogger } from "../logger";
import { isChildPath } from "../util/is-child-path";

export type BundleEvent = Data.TaggedEnum<{
	bundleChanged: { bundle: NodeCG.Bundle };
	invalidBundle: { bundle: NodeCG.Bundle; error: unknown };
	bundleRemoved: { bundleName: string };
	gitChanged: { bundle: NodeCG.Bundle };
}>;

export const bundleEvent = Data.taggedEnum<BundleEvent>();

export class BundleManager extends Effect.Service<BundleManager>()(
	"BundleManager",
	{
		scoped: Effect.gen(function* () {
			// Start up the watcher, but don't watch any files yet.
			// We'll add the files we want to watch later, in the init() method.
			const watcher = yield* getWatcher([], {
				persistent: true,
				ignoreInitial: true,
				followSymlinks: true,
				ignored: [
					/\/.+___jb_.+___/, // Ignore temp files created by JetBrains IDEs
					/\/node_modules\//, // Ignore node_modules folders
					/\/bower_components\//, // Ignore bower_components folders
					/\/.+\.lock/, // Ignore lockfiles
				],
			});

			const events = yield* PubSub.unbounded<BundleEvent>();

			const blacklistedBundleDirectories = ["node_modules", "bower_components"];

			const bundles: NodeCG.Bundle[] = [];
			const log = createLogger("bundle-manager");

			const nodecgConfig = yield* NodecgConfig;

			// TODO: These are leftover from previous class implementation constructor
			const bundlesPaths = [
				path.join(rootPaths.getRuntimeRoot(), "bundles"),
				...(nodecgConfig.bundles?.paths ?? []),
			];
			const cfgPath = path.join(rootPaths.getRuntimeRoot(), "cfg");
			const nodecgPackageJson = yield* NodecgPackageJson;
			const nodecgVersion = nodecgPackageJson.version;

			const gitChangeHandler = Effect.fn("gitChangeHandler")(function* (
				bundle: NodeCG.Bundle,
			) {
				bundle.git = parseBundleGit(bundle.dir);
				yield* events.publish(bundleEvent.gitChanged({ bundle }));
			});

			const ready = yield* Deferred.make();
			const addStreamForReady = yield* listenToAdd(watcher);
			yield* addStreamForReady.pipe(
				Stream.as(null),
				Stream.prepend(Chunk.of(null)),
				Stream.debounce(Duration.seconds(1)),
				Stream.take(1),
				Stream.runDrain,
				Effect.andThen(() => Deferred.succeed(ready, undefined)),
				Effect.forkScoped,
			);

			const bundleRootPaths = isLegacyProject()
				? bundlesPaths
				: [rootPaths.runtimeRootPath, ...bundlesPaths];

			const addStream = yield* listenToAdd(watcher);
			const changeStream = yield* listenToChange(watcher);
			const unlinkStream = yield* listenToUnlink(watcher);
			type StreamEvent = Stream.Stream.Success<
				typeof addStream | typeof changeStream | typeof unlinkStream
			>;
			const fileChangeHandler = Stream.mergeAll<StreamEvent, never, never>(
				[addStream, changeStream, unlinkStream],
				{ concurrency: "unbounded" },
			).pipe(
				Stream.tap(Console.log),
				Stream.filterMap(({ path: filePath, _tag }) => {
					const bundleName = findBundleName(bundleRootPaths, filePath);
					if (!bundleName) {
						return Option.none();
					}
					const bundle = find(bundleName);
					if (!bundle) {
						return Option.none();
					}
					return Option.some({ _tag, bundleName, filePath, bundle });
				}),
				Stream.groupByKey(({ bundleName }) => bundleName),
				GroupBy.evaluate((_, stream) =>
					stream.pipe(
						Stream.groupByKey(({ _tag, bundleName, filePath }) => {
							if (_tag === "change" && isManifest(bundleName, filePath)) {
								return "parseBundle";
							}
							if (isPanelHTMLFile(bundleName, filePath)) {
								return "parseBundle";
							}
							if (isGitData(bundleName, filePath)) {
								return "parseGit";
							}
							return "noop";
						}),
						GroupBy.evaluate((key, stream) => {
							return Match.value(key).pipe(
								Match.when("parseBundle", () =>
									stream.pipe(
										Stream.debounce(Duration.millis(500)),
										Stream.mapEffect(({ bundle }) =>
											parseBundleAndEmit(bundle),
										),
									),
								),
								Match.when("parseGit", () =>
									stream.pipe(
										Stream.debounce(Duration.millis(250)),
										Stream.mapEffect(({ bundle }) => gitChangeHandler(bundle)),
									),
								),
								Match.when("noop", () => Stream.void),
								Match.exhaustive,
							);
						}),
					),
				),
			);
			yield* Effect.forkScoped(fileChangeHandler.pipe(Stream.runDrain));

			const errorStream = yield* listenToError(watcher);
			yield* Effect.forkScoped(
				errorStream.pipe(
					Stream.tap(({ error }) => {
						log.error((error as Error).stack);
						return Effect.void;
					}),
					Stream.runDrain,
				),
			);

			bundleRootPaths.forEach((bundlesPath) => {
				log.trace(`Loading bundles from ${bundlesPath}`);

				const handleBundle = (bundlePath: string) => {
					if (!fs.statSync(bundlePath).isDirectory()) {
						return;
					}

					// Prevent attempting to load unwanted directories. Those specified above and all dot-prefixed.
					const bundleFolderName = path.basename(bundlePath);
					if (
						blacklistedBundleDirectories.includes(bundleFolderName) ||
						bundleFolderName.startsWith(".")
					) {
						return;
					}

					const bundlePackageJson = fs.readFileSync(
						path.join(bundlePath, "package.json"),
						"utf-8",
					);
					const bundleName = JSON.parse(bundlePackageJson).name;

					if (nodecgConfig?.bundles?.disabled?.includes(bundleName)) {
						log.debug(
							`Not loading bundle ${bundleName} as it is disabled in config`,
						);
						return;
					}

					if (
						nodecgConfig?.bundles?.enabled &&
						!nodecgConfig?.bundles.enabled.includes(bundleName)
					) {
						log.debug(
							`Not loading bundle ${bundleName} as it is not enabled in config`,
						);
						return;
					}

					log.debug(`Loading bundle ${bundleName}`);

					// Parse each bundle and push the result onto the bundles array
					const bundle = parseBundle(
						bundlePath,
						loadBundleCfg(cfgPath, bundleName),
					);

					if (isLegacyProject()) {
						if (!bundle.compatibleRange) {
							log.error(
								`${bundle.name}'s package.json does not have a "nodecg.compatibleRange" property.`,
							);
							return;
						}
						// Check if the bundle is compatible with this version of NodeCG
						if (!semver.satisfies(nodecgVersion, bundle.compatibleRange)) {
							log.error(
								`${bundle.name} requires NodeCG version ${bundle.compatibleRange}, current version is ${nodecgVersion}`,
							);
							return;
						}
					}

					bundles.push(bundle);

					// Use `chokidar` to watch for file changes within bundles.
					// Workaround for https://github.com/paulmillr/chokidar/issues/419
					// This workaround is necessary to fully support symlinks.
					// This is applied after the bundle has been validated and loaded.
					// Bundles that do not properly load upon startup are not recognized for updates.
					watcher.add([
						path.join(bundlePath, ".git"), // Watch `.git` directories.
						path.join(bundlePath, "dashboard"), // Watch `dashboard` directories.
						path.join(bundlePath, "package.json"), // Watch each bundle's `package.json`.
					]);
					console.log(watcher.getWatched());
				};

				if (bundlesPath === rootPaths.runtimeRootPath) {
					handleBundle(rootPaths.runtimeRootPath);
				} else if (fs.existsSync(bundlesPath)) {
					const bundleFolders = fs.readdirSync(bundlesPath);
					bundleFolders.forEach((bundleFolderName) => {
						const bundlePath = path.join(bundlesPath, bundleFolderName);
						handleBundle(bundlePath);
					});
				}
			});

			/**
			 * Returns a shallow-cloned array of all currently active bundles.
			 */
			function all() {
				return bundles.slice(0);
			}

			/**
			 * Returns the bundle with the given name. undefined if not found.
			 */
			function find(name: string): NodeCG.Bundle | undefined {
				return bundles.find((b) => b.name === name);
			}

			/**
			 * Adds a bundle to the internal list, replacing any existing bundle with the same name.
			 */
			function add(bundle: NodeCG.Bundle) {
				return Effect.gen(function* () {
					if (!bundle) {
						return;
					}

					// Remove any existing bundles with this name
					if (find(bundle.name)) {
						yield* remove(bundle.name);
					}

					bundles.push(bundle);
				});
			}

			/**
			 * Removes a bundle with the given name from the internal list. Does nothing if no match found.
			 * @param bundleName {String}
			 */
			function remove(bundleName: string) {
				return Effect.gen(function* () {
					const len = bundles.length;
					for (let i = 0; i < len; i++) {
						if (!bundles[i]) {
							continue;
						}

						if (bundles[i]!.name === bundleName) {
							bundles.splice(i, 1);
							yield* events.publish(bundleEvent.bundleRemoved({ bundleName }));
							return;
						}
					}
				});
			}

			/**
			 * Checks if a given path is a panel HTML file of a given bundle.
			 * @param bundleName {String}
			 * @param filePath {String}
			 * @returns {Boolean}
			 * @private
			 */
			function isPanelHTMLFile(bundleName: string, filePath: string): boolean {
				const bundle = find(bundleName);
				if (bundle) {
					return bundle.dashboard.panels.some((panel) =>
						panel.path.endsWith(filePath),
					);
				}

				return false;
			}

			// TODO: Convert to proper Effect.fn()
			function parseBundleAndEmit(bundle: NodeCG.Bundle) {
				return Effect.gen(function* () {
					const reparsedBundle = parseBundle(
						bundle.dir,
						loadBundleCfg(cfgPath, bundle.name),
					);
					yield* add(reparsedBundle);
					yield* events.publish(
						bundleEvent.bundleChanged({ bundle: reparsedBundle }),
					);
				}).pipe(
					Effect.catchAllDefect(
						Effect.fn(function* (error) {
							log.warn(
								'Unable to handle the bundle "%s" change:\n%s',
								bundle.name,
								error instanceof Error ? error.stack : String(error),
							);
							yield* events.publish(
								bundleEvent.invalidBundle({ bundle, error }),
							);
						}),
					),
				);
			}

			const subscribe = Effect.fn(function* () {
				const queue = yield* PubSub.subscribe(events);
				return Stream.fromQueue(queue);
			});

			const waitForReady = () => Deferred.await(ready);

			return { find, all, remove, subscribe, waitForReady };
		}),
	},
) {}

/**
 * Checks if a given path is the manifest file for a given bundle.
 * @param bundleName {String}
 * @param filePath {String}
 * @returns {Boolean}
 * @private
 */
function isManifest(bundleName: string, filePath: string): boolean {
	return (
		path.dirname(filePath).endsWith(bundleName) &&
		path.basename(filePath) === "package.json"
	);
}

/**
 * Checks if a given path is in the .git dir of a bundle.
 * @param bundleName {String}
 * @param filePath {String}
 * @returns {Boolean}
 * @private
 */
function isGitData(bundleName: string, filePath: string): boolean {
	const regex = new RegExp(`${bundleName}\\${path.sep}\\.git`);
	return regex.test(filePath);
}

/**
 * Determines which config file to use for a bundle.
 */
function loadBundleCfg(
	cfgDir: string,
	bundleName: string,
): NodeCG.Bundle.UnknownConfig | undefined {
	try {
		const cc = cosmiconfig("nodecg", {
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

function getParentProjectName(
	changePath: string,
	rootPath: string,
): string | false {
	if (rootPath !== changePath && !isChildPath(rootPath, changePath)) {
		return false;
	}
	const filePath = path.join(changePath, "package.json");
	try {
		const fileContent = fs.readFileSync(filePath, "utf-8");
		try {
			const parsed = JSON.parse(fileContent);
			return parsed.name as string;
		} catch (error) {
			return false;
		}
	} catch (error) {
		const parentDir = path.join(changePath, "..");
		if (parentDir === changePath) {
			return false;
		}
		return getParentProjectName(parentDir, rootPath);
	}
}

function findBundleName(
	bundlesPaths: string[],
	filePath: string,
): string | false {
	for (const bundlesPath of bundlesPaths) {
		const result = getParentProjectName(filePath, bundlesPath);
		if (result) {
			return result;
		}
	}
	return false;
}
