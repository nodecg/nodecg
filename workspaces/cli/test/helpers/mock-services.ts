/**
 * Mock service layers for testing
 * These provide test implementations of services that can be injected via Effect's DI
 */
import { Effect, Layer, Context, Ref } from "effect";
import { CommandService, CommandError } from "../../src/services/command.js";
import { GitService, GitError } from "../../src/services/git.js";
import { TerminalService, TerminalError } from "../../src/services/terminal.js";
import { FileSystemService, FileSystemError } from "../../src/services/file-system.js";
import { HttpService, HttpError } from "../../src/services/http.js";
import { NpmService, NpmError } from "../../src/services/npm.js";
import type { PathService } from "../../src/services/path.js";
import type { PackageResolverService } from "../../src/services/package-resolver.js";
import type { JsonSchemaService } from "../../src/services/json-schema.js";

/**
 * Mock CommandService that records all commands executed
 */
export class MockCommandService {
	constructor(readonly commands: Ref.Ref<Array<{ cmd: string; args: ReadonlyArray<string> }>>) {}

	exec = Effect.fn("exec")(function* (
		cmd: string,
		args: ReadonlyArray<string>,
		_options?: { cwd?: string },
	) {
		yield* Ref.update(this.commands, (cmds) => [...cmds, { cmd, args }]);
	});

	string = Effect.fn("string")(function* (
		cmd: string,
		args: ReadonlyArray<string>,
		_options?: { cwd?: string },
	): string {
		yield* Ref.update(this.commands, (cmds) => [...cmds, { cmd, args }]);
		return "";
	});
}

/**
 * Create a mock CommandService layer with configurable behavior
 */
export const MockCommandServiceLayer = (options?: {
	execShouldFail?: boolean;
	stringShouldFail?: boolean;
	stringValue?: string;
}) =>
	Layer.effect(
		CommandService,
		Effect.gen(function* () {
			const commands = yield* Ref.make<Array<{ cmd: string; args: ReadonlyArray<string> }>>([]);

			return CommandService.make({
				exec: Effect.fn("exec")(function* (
					cmd: string,
					args: ReadonlyArray<string>,
					_options?: { cwd?: string },
				) {
					yield* Ref.update(commands, (cmds) => [...cmds, { cmd, args }]);
					if (options?.execShouldFail) {
						return yield* Effect.fail(
							new CommandError({
								message: "Command failed",
								command: `${cmd} ${args.join(" ")}`,
								exitCode: 1,
							}),
						);
					}
				}),

				string: Effect.fn("string")(function* (
					cmd: string,
					args: ReadonlyArray<string>,
					_options?: { cwd?: string },
				) {
					yield* Ref.update(commands, (cmds) => [...cmds, { cmd, args }]);
					if (options?.stringShouldFail) {
						return yield* Effect.fail(
							new CommandError({
								message: "Command failed",
								command: `${cmd} ${args.join(" ")}`,
							}),
						);
					}
					return options?.stringValue || "";
				}),
			});
		}),
	);

/**
 * Mock GitService layer
 */
export const MockGitServiceLayer = (options?: {
	checkAvailableShouldFail?: boolean;
	tags?: string[];
}) =>
	Layer.succeed(
		GitService,
		GitService.make({
			checkAvailable: Effect.fn("checkAvailable")(function* () {
				if (options?.checkAvailableShouldFail) {
					return yield* Effect.fail(
						new GitError({
							message: "git is not available",
							operation: "check",
						}),
					);
				}
			}),

			clone: Effect.fn("clone")(function* (_url: string, _destination: string) {}),

			checkout: Effect.fn("checkout")(function* (_version: string, _cwd: string) {}),

			listRemoteTags: Effect.fn("listRemoteTags")(function* (_repoUrl: string) {
				return options?.tags || ["v1.0.0", "v2.0.0"];
			}),
		}),
	);

/**
 * Mock TerminalService that captures output
 */
export const MockTerminalServiceLayer = () =>
	Layer.effect(
		TerminalService,
		Effect.gen(function* () {
			const output = yield* Ref.make<string[]>([]);
			const confirmResponse = yield* Ref.make(true);

			return TerminalService.make({
				write: Effect.fn("write")(function* (message: string) {
					yield* Ref.update(output, (lines) => [...lines, message]);
				}),

				writeLine: Effect.fn("writeLine")(function* (message: string) {
					yield* Ref.update(output, (lines) => [...lines, message + "\n"]);
				}),

				writeSuccess: Effect.fn("writeSuccess")(function* (message: string) {
					yield* Ref.update(output, (lines) => [...lines, `[SUCCESS] ${message}`]);
				}),

				writeError: Effect.fn("writeError")(function* (message: string) {
					yield* Ref.update(output, (lines) => [...lines, `[ERROR] ${message}`]);
				}),

				writeInfo: Effect.fn("writeInfo")(function* (message: string) {
					yield* Ref.update(output, (lines) => [...lines, `[INFO] ${message}`]);
				}),

				writeColored: Effect.fn("writeColored")(function* (message: string, _color: string) {
					yield* Ref.update(output, (lines) => [...lines, message]);
				}),

				confirm: Effect.fn("confirm")(function* (_message: string) {
					return yield* Ref.get(confirmResponse);
				}),

				readLine: Effect.fn("readLine")(function* () {
					return "test input";
				}),
			});
		}),
	);

/**
 * Mock FileSystemService with in-memory storage
 */
export const MockFileSystemServiceLayer = (initialFiles?: Record<string, unknown>) =>
	Layer.effect(
		FileSystemService,
		Effect.gen(function* () {
			const files = yield* Ref.make<Record<string, unknown>>(initialFiles || {});

			return FileSystemService.make({
				readJson: Effect.fn("readJson")(function* (path: string, _schema: any) {
					const allFiles = yield* Ref.get(files);
					const content = allFiles[path];
					if (content === undefined) {
						return yield* Effect.fail(
							new FileSystemError({
								message: `File not found: ${path}`,
								path,
							}),
						);
					}
					return content;
				}),

				writeJson: Effect.fn("writeJson")(function* (path: string, data: any) {
					yield* Ref.update(files, (f) => ({ ...f, [path]: data }));
				}),

				exists: Effect.fn("exists")(function* (path: string) {
					const allFiles = yield* Ref.get(files);
					return path in allFiles;
				}),

				mkdir: Effect.fn("mkdir")(function* (_path: string, _options?: any) {}),

				rm: Effect.fn("rm")(function* (path: string, _options?: any) {
					yield* Ref.update(files, (f) => {
						const { [path]: _, ...rest } = f;
						return rest;
					});
				}),

				readdir: Effect.fn("readdir")(function* (_path: string) {
					return [];
				}),

				readFileString: Effect.fn("readFileString")(function* (path: string) {
					const allFiles = yield* Ref.get(files);
					const content = allFiles[path];
					if (typeof content !== "string") {
						return yield* Effect.fail(
							new FileSystemError({
								message: `File not found or not a string: ${path}`,
								path,
							}),
						);
					}
					return content;
				}),

				writeFileString: Effect.fn("writeFileString")(function* (path: string, content: string) {
					yield* Ref.update(files, (f) => ({ ...f, [path]: content }));
				}),

				extractTarball: Effect.fn("extractTarball")(function* (_stream: any, _options?: any) {}),
			});
		}),
	);

/**
 * Mock HttpService with configurable responses
 */
export const MockHttpServiceLayer = (responses?: Record<string, unknown>) =>
	Layer.succeed(
		HttpService,
		HttpService.make({
			fetchJson: Effect.fn("fetchJson")(function* (url: string, _schema: any) {
				const response = responses?.[url];
				if (!response) {
					return yield* Effect.fail(
						new HttpError({
							message: `No mock response for ${url}`,
							url,
						}),
					);
				}
				return response;
			}),

			fetchStream: Effect.fn("fetchStream")(function* (_url: string) {
				// Return empty stream for tests
				return undefined as any;
			}),

			fetch: Effect.fn("fetch")(function* (_url: string, _options?: any) {
				return {} as any;
			}),
		}),
	);

/**
 * Mock NpmService with configurable package data
 */
export const MockNpmServiceLayer = (packages?: Record<string, string[]>) =>
	Layer.succeed(
		NpmService,
		NpmService.make({
			listVersions: Effect.fn("listVersions")(function* (packageName: string) {
				return packages?.[packageName] || ["1.0.0", "2.0.0"];
			}),

			getRelease: Effect.fn("getRelease")(function* (_packageName: string, version: string) {
				return {
					version,
					dist: {
						tarball: `https://registry.npmjs.org/pkg/-/pkg-${version}.tgz`,
					},
				};
			}),

			install: Effect.fn("install")(function* (_cwd: string, _production?: boolean) {}),

			yarnInstall: Effect.fn("yarnInstall")(function* (_cwd: string, _production?: boolean) {}),
		}),
	);

/**
 * Mock PathService with configurable behavior
 */
export const MockPathServiceLayer = (options?: {
	nodecgPath?: string;
	currentVersion?: string;
	containsNodeCG?: boolean;
	isBundle?: boolean;
}) => {
	// Use Effect.Service pattern to create properly typed mock
	const MockPathServiceTag = Context.GenericTag<{
		pathContainsNodeCG: (path: string) => Effect.Effect<boolean>;
		getNodeCGPath: () => Effect.Effect<string>;
		isBundleFolder: (path: string) => Effect.Effect<boolean>;
		getCurrentNodeCGVersion: () => Effect.Effect<string>;
	}>("PathService");

	return Layer.succeed(
		MockPathServiceTag,
		{
			pathContainsNodeCG: Effect.fn("pathContainsNodeCG")(function* (_path: string) {
				return options?.containsNodeCG ?? false;
			}),

			getNodeCGPath: Effect.fn("getNodeCGPath")(function* () {
				return options?.nodecgPath || "/mock/nodecg";
			}),

			isBundleFolder: Effect.fn("isBundleFolder")(function* (_path: string) {
				return options?.isBundle ?? true;
			}),

			getCurrentNodeCGVersion: Effect.fn("getCurrentNodeCGVersion")(function* () {
				return options?.currentVersion || "1.0.0";
			}),
		},
	);
};

/**
 * Mock PackageResolverService with configurable behavior
 */
export const MockPackageResolverServiceLayer = () => {
	const MockPackageResolverTag = Context.GenericTag<{
		resolveGitUrl: (spec: string) => Effect.Effect<{ url: string; name: string }>;
		parseVersionSpec: (spec: string) => Effect.Effect<{ repo: string; range: string }>;
	}>("PackageResolverService");

	return Layer.succeed(
		MockPackageResolverTag,
		{
			resolveGitUrl: Effect.fn("resolveGitUrl")(function* (spec: string) {
				// Simple mock implementation
				const name = spec.split("/").pop()?.replace(".git", "") || "test-bundle";
				return {
					url: `https://github.com/test/${name}.git`,
					name,
				};
			}),

			parseVersionSpec: Effect.fn("parseVersionSpec")(function* (spec: string) {
				if (spec.indexOf("#") <= 0) {
					return { repo: spec, range: "" };
				}
				const [repo, range] = spec.split("#");
				return { repo: repo || spec, range: range || "" };
			}),
		},
	);
};

/**
 * Mock JsonSchemaService with configurable behavior
 */
export const MockJsonSchemaServiceLayer = (defaultData?: unknown) => {
	const MockJsonSchemaTag = Context.GenericTag<{
		applyDefaults: (schemaPath: string) => Effect.Effect<unknown>;
		validate: (data: unknown, schemaPath: string) => Effect.Effect<void>;
		compileToTypeScript: (
			schemaPath: string,
			outputPath: string,
			options?: any,
		) => Effect.Effect<void>;
	}>("JsonSchemaService");

	return Layer.succeed(
		MockJsonSchemaTag,
		{
			applyDefaults: Effect.fn("applyDefaults")(function* (_schemaPath: string) {
				return defaultData || { defaultKey: "defaultValue" };
			}),

			validate: Effect.fn("validate")(function* (_data: unknown, _schemaPath: string) {
				// Always succeeds in mock
			}),

			compileToTypeScript: Effect.fn("compileToTypeScript")(function* (
				_schemaPath: string,
				_outputPath: string,
				_options?: any,
			) {
				// No-op in mock
			}),
		},
	);
};
