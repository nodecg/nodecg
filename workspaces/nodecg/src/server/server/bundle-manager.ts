import fs from "node:fs";
import path from "node:path";

import { isLegacyProject, rootPaths } from "@nodecg/internal-util";
import { cosmiconfigSync as cosmiconfig } from "cosmiconfig";
import {
	Chunk,
	Data,
	Effect,
	GroupBy,
	Option,
	PubSub,
	Queue,
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
} from "../_effect/chokidar.js";
import { GitService } from "../_effect/git-service.js";
import { NodecgVersion } from "../_effect/nodecg-version.js";
import { parseBundle } from "../bundle-parser";
import { config } from "../config";
import { createLogger } from "../logger";
import { isChildPath } from "../util/is-child-path";

// Timing constants (milliseconds)
const READY_WAIT_THRESHOLD = 1000;
const CHANGE_INITIAL_DELAY = 100;
const BACKOFF_DELAY = 500;
const GIT_DEBOUNCE_DELAY = 250;

const blacklistedBundleDirectories = ["node_modules", "bower_components"];
const log = createLogger("bundle-manager");

// Tick marker for timing (no payload needed)
interface Tick {
	readonly _tag: "Tick";
}
const Tick = Data.tagged<Tick>("Tick");

// BundleEvent tagged union
export type BundleEvent = Data.TaggedEnum<{
	ready: object;
	bundleChanged: { bundle: NodeCG.Bundle };
	invalidBundle: { bundle: NodeCG.Bundle; error: Error };
	bundleRemoved: { bundleName: string };
	gitChanged: { bundle: NodeCG.Bundle };
}>;
export const bundleEvent = Data.taggedEnum<BundleEvent>();

// File change event for internal routing
interface FileChange {
	readonly bundleName: string;
	readonly bundlePath: string;
	readonly filePath: string;
	readonly type: "manifest" | "panel" | "git";
}

export class BundleManager extends Effect.Service<BundleManager>()(
	"BundleManager",
	{
		scoped: Effect.gen(function* () {
			const gitService = yield* GitService;
			const { version: nodecgVersion } = yield* NodecgVersion;

			// Config derived from existing imports
			// Resolve relative paths to absolute paths based on NODECG_ROOT
			const bundlesPaths = [
				path.join(rootPaths.getRuntimeRoot(), "bundles"),
				...(config.bundles?.paths ?? []).map((p) =>
					path.isAbsolute(p) ? p : path.join(rootPaths.getRuntimeRoot(), p),
				),
			];
			const cfgPath = path.join(rootPaths.getRuntimeRoot(), "cfg");
			const nodecgConfig = config;

			// State (mutable)
			let bundles: NodeCG.Bundle[] = [];
			const bundlePaths = new Map<string, string>();

			const events = yield* PubSub.unbounded<BundleEvent>();

			// Separate queues for different event types (can't share queue between multiple consumers)
			const bundleChangeQueue = yield* Queue.unbounded<FileChange>(); // manifest + panel
			const gitChangeQueue = yield* Queue.unbounded<FileChange>(); // git
			const readyTickQueue = yield* Queue.unbounded<Tick>();

			// Helper: check if a path is a panel HTML file
			const isPanelHTMLFile = (bundleName: string, filePath: string) => {
				const bundle = bundles.find((b) => b.name === bundleName);
				if (!bundle) return false;
				// Compare using relative path from dashboard to avoid /tmp vs /private/tmp issues on macOS
				return bundle.dashboard.panels.some((panel) =>
					filePath.endsWith(path.join("dashboard", panel.file)),
				);
			};

			// Helper: add or replace bundle
			const addBundle = (bundle: NodeCG.Bundle) => {
				bundles = bundles.filter((b) => b.name !== bundle.name);
				bundles.push(bundle);
			};

			// Helper: remove bundle
			const removeBundle = Effect.fn("BundleManager.remove")(function* (
				bundleName: string,
			) {
				bundles = bundles.filter((b) => b.name !== bundleName);
				yield* PubSub.publish(
					events,
					bundleEvent.bundleRemoved({ bundleName }),
				);
			});

			// Parse and load a single bundle
			const loadBundle = (bundlePath: string) =>
				Effect.sync(() => {
					if (!fs.statSync(bundlePath).isDirectory()) {
						return Option.none<NodeCG.Bundle>();
					}

					const bundleFolderName = path.basename(bundlePath);
					if (
						blacklistedBundleDirectories.includes(bundleFolderName) ||
						bundleFolderName.startsWith(".")
					) {
						return Option.none<NodeCG.Bundle>();
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
						return Option.none<NodeCG.Bundle>();
					}

					if (
						nodecgConfig?.bundles?.enabled &&
						!nodecgConfig?.bundles.enabled.includes(bundleName)
					) {
						log.debug(
							`Not loading bundle ${bundleName} as it is not enabled in config`,
						);
						return Option.none<NodeCG.Bundle>();
					}

					log.debug(`Loading bundle ${bundleName}`);

					const bundle = parseBundle(
						bundlePath,
						loadBundleCfg(cfgPath, bundleName),
					);

					if (isLegacyProject()) {
						if (!bundle.compatibleRange) {
							log.error(
								`${bundle.name}'s package.json does not have a "nodecg.compatibleRange" property.`,
							);
							return Option.none<NodeCG.Bundle>();
						}
						if (!semver.satisfies(nodecgVersion, bundle.compatibleRange)) {
							log.error(
								`${bundle.name} requires NodeCG version ${bundle.compatibleRange}, current version is ${nodecgVersion}`,
							);
							return Option.none<NodeCG.Bundle>();
						}
					}

					return Option.some(bundle);
				});

			// Compute bundle root paths
			const bundleRootPaths = isLegacyProject()
				? bundlesPaths
				: [rootPaths.runtimeRootPath, ...bundlesPaths];

			// Collect all watch paths and load initial bundles
			const watchPaths: string[] = [];
			const initialBundles: NodeCG.Bundle[] = [];
			const bundlePathMap = new Map<string, string>();

			for (const bundlesPath of bundleRootPaths) {
				log.trace(`Loading bundles from ${bundlesPath}`);

				const handleBundlePath = (bundlePath: string) => {
					try {
						const result = Effect.runSync(loadBundle(bundlePath));
						if (Option.isSome(result)) {
							const bundle = result.value;
							initialBundles.push(bundle);
							bundlePathMap.set(bundle.name, bundlePath);
							watchPaths.push(
								path.join(bundlePath, ".git"),
								path.join(bundlePath, "dashboard"),
								path.join(bundlePath, "package.json"),
							);
						}
					} catch (e) {
						log.error(`Failed to load bundle at ${bundlePath}:`, e);
					}
				};

				if (bundlesPath === rootPaths.runtimeRootPath) {
					handleBundlePath(rootPaths.runtimeRootPath);
				} else if (fs.existsSync(bundlesPath)) {
					const bundleFolders = fs.readdirSync(bundlesPath);
					for (const bundleFolderName of bundleFolders) {
						const bundlePath = path.join(bundlesPath, bundleFolderName);
						handleBundlePath(bundlePath);
					}
				}
			}

			// Initialize state
			bundles = initialBundles;
			for (const [name, bundlePath] of bundlePathMap) {
				bundlePaths.set(name, bundlePath);
			}

			// Start file watcher
			const watcher = yield* getWatcher(watchPaths, {
				persistent: true,
				ignoreInitial: true,
				followSymlinks: true,
				ignored: [
					/\/.+___jb_.+___/, // JetBrains temp files
					/\/node_modules\//,
					/\/bower_components\//,
					/\/.+\.lock/,
				],
			});

			// Helper to safely resolve symlinks, returns original path on error
			const safeRealpath = (p: string) => {
				try {
					return fs.realpathSync(p);
				} catch {
					return p;
				}
			};

			// Process file events and route to appropriate queues
			const processFileEvent = (
				filePath: string,
				eventType: "add" | "change" | "unlink",
			) =>
				Effect.gen(function* () {
					// Normalize path for consistent comparison (handles /tmp vs /private/tmp on macOS)
					const normalizedPath = safeRealpath(filePath);

					// Find which bundle this file belongs to
					let foundBundle: { name: string; path: string } | undefined;

					for (const [bundleName, bundlePath] of bundlePaths) {
						// Resolve both paths for comparison to handle symlinks
						const normalizedBundlePath = safeRealpath(bundlePath);
						if (normalizedPath.startsWith(normalizedBundlePath)) {
							foundBundle = { name: bundleName, path: bundlePath };
							break;
						}
					}

					if (!foundBundle) {
						// Try to find parent project name
						for (const bundlesPath of bundleRootPaths) {
							const bundleName = getParentProjectName(filePath, bundlesPath);
							if (bundleName) {
								const bundlePath = bundlePaths.get(bundleName);
								if (bundlePath) {
									foundBundle = { name: bundleName, path: bundlePath };
									break;
								}
							}
						}
					}

					if (!foundBundle) return;

					const { name: bundleName, path: bundlePath } = foundBundle;

					// Determine change type and route to appropriate queue
					if (isGitData(bundleName, filePath)) {
						yield* Queue.offer(gitChangeQueue, {
							bundleName,
							bundlePath,
							filePath,
							type: "git",
						});
					} else if (isManifest(bundleName, filePath)) {
						yield* Queue.offer(bundleChangeQueue, {
							bundleName,
							bundlePath,
							filePath,
							type: "manifest",
						});
					} else if (isPanelHTMLFile(bundleName, filePath)) {
						yield* Queue.offer(bundleChangeQueue, {
							bundleName,
							bundlePath,
							filePath,
							type: "panel",
						});
					}

					// For "add" events, signal ready tick
					if (eventType === "add") {
						yield* Queue.offer(readyTickQueue, Tick());
					}
				});

			// Set up file event listeners
			const [addStream, changeStream, unlinkStream, errorStream] =
				yield* Effect.all(
					[
						listenToAdd(watcher),
						listenToChange(watcher),
						listenToUnlink(watcher),
						listenToError(watcher),
					],
					{ concurrency: "unbounded" },
				);

			// Fork add event processing
			yield* Effect.forkScoped(
				addStream.pipe(
					Stream.runForEach((event) => processFileEvent(event.path, "add")),
				),
			);

			// Fork change event processing
			yield* Effect.forkScoped(
				changeStream.pipe(
					Stream.runForEach((event) => processFileEvent(event.path, "change")),
				),
			);

			// Fork unlink event processing
			yield* Effect.forkScoped(
				unlinkStream.pipe(
					Stream.runForEach((event) => processFileEvent(event.path, "unlink")),
				),
			);

			// Fork error handling
			yield* Effect.forkScoped(
				errorStream.pipe(
					Stream.runForEach((event) =>
						Effect.sync(() => {
							log.error("Watcher error:", event.error);
						}),
					),
				),
			);

			// Ready event: fires 1000ms after last add event, or initial 1000ms if no adds
			yield* Effect.forkScoped(
				Effect.gen(function* () {
					yield* Stream.fromQueue(readyTickQueue).pipe(
						Stream.prepend(Chunk.of(Tick())),
						Stream.debounce(`${READY_WAIT_THRESHOLD} millis`),
						Stream.take(1),
						Stream.runDrain,
					);
					yield* PubSub.publish(events, bundleEvent.ready());
				}),
			);

			// Handle bundle changes with debounce per bundle (500ms backoff)
			yield* Effect.forkScoped(
				Stream.fromQueue(bundleChangeQueue).pipe(
					Stream.groupByKey((fc) => fc.bundleName),
					GroupBy.evaluate((bundleName, stream) =>
						stream.pipe(
							Stream.debounce(`${BACKOFF_DELAY} millis`),
							Stream.runForEach(() =>
								Effect.gen(function* () {
									yield* Effect.sleep(`${CHANGE_INITIAL_DELAY} millis`);

									const bundle = bundles.find((b) => b.name === bundleName);
									if (!bundle) return;

									log.debug("Processing change event for", bundleName);

									try {
										const reparsedBundle = parseBundle(
											bundle.dir,
											loadBundleCfg(cfgPath, bundle.name),
										);
										addBundle(reparsedBundle);
										yield* PubSub.publish(
											events,
											bundleEvent.bundleChanged({ bundle: reparsedBundle }),
										);
									} catch (error: unknown) {
										log.warn(
											'Unable to handle the bundle "%s" change:\n%s',
											bundleName,
											error instanceof Error ? error.stack : String(error),
										);
										yield* PubSub.publish(
											events,
											bundleEvent.invalidBundle({
												bundle,
												error:
													error instanceof Error
														? error
														: new Error(String(error)),
											}),
										);
									}
								}),
							),
						),
					),
					Stream.runDrain,
				),
			);

			// Handle git changes with debounce per bundle (250ms)
			yield* Effect.forkScoped(
				Stream.fromQueue(gitChangeQueue).pipe(
					Stream.groupByKey((fc) => fc.bundleName),
					GroupBy.evaluate((bundleName, stream) =>
						stream.pipe(
							Stream.debounce(`${GIT_DEBOUNCE_DELAY} millis`),
							Stream.runForEach((fc) =>
								Effect.gen(function* () {
									const bundle = bundles.find((b) => b.name === bundleName);
									if (!bundle) return;

									const gitHead = yield* gitService
										.getGitHead(fc.bundlePath)
										.pipe(Effect.catchAll(() => Effect.succeed(Option.none())));

									if (Option.isSome(gitHead)) {
										const gitData = gitHead.value;
										bundle.git = {
											branch: Option.getOrElse(gitData.branch, () => ""),
											hash: gitData.hash,
											shortHash: gitData.shortHash,
											date: gitData.date,
											message: gitData.message,
										};
									} else {
										bundle.git = undefined;
									}

									yield* PubSub.publish(
										events,
										bundleEvent.gitChanged({ bundle }),
									);
								}),
							),
						),
					),
					Stream.runDrain,
				),
			);

			// Subscribe and filter by tag - each call creates fresh scoped subscription
			const listenTo = <Tag extends BundleEvent["_tag"]>(tag: Tag) =>
				Effect.gen(function* () {
					const queue = yield* PubSub.subscribe(events);
					return Stream.fromQueue(queue).pipe(
						Stream.filter(
							(e): e is Extract<BundleEvent, { _tag: Tag }> => e._tag === tag,
						),
					);
				});

			return {
				all: () => Effect.succeed(bundles),
				find: (name: string) =>
					Effect.succeed(bundles.find((b) => b.name === name)),
				remove: removeBundle,
				listenTo,
				waitForReady: () =>
					listenTo("ready").pipe(
						Effect.andThen(Stream.take(1)),
						Effect.andThen(Stream.runDrain),
					),
			};
		}),
		dependencies: [GitService.Default],
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

function getParentProjectName(changePath: string, rootPath: string) {
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
