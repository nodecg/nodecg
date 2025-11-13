/**
 * Mock service layers for testing
 * These provide test implementations of services that can be injected via Effect's DI
 */
import { Context, Effect, Layer, Ref } from "effect";

import { CommandError, CommandService } from "../services/command.js";
import { FileSystemError, FileSystemService } from "../services/file-system.js";
import { GitError, GitService } from "../services/git.js";
import { HttpError, HttpService } from "../services/http.js";
import { NpmService } from "../services/npm.js";
import { TerminalService } from "../services/terminal.js";

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
			const commands = yield* Ref.make<
				{ cmd: string; args: readonly string[] }[]
			>([]);

			return CommandService.make({
				exec: Effect.fn("exec")(function* (
					cmd: string,
					args: readonly string[],
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
					args: readonly string[],
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
 * Mock GitService layer with CommandService dependency
 */
export const MockGitServiceLayer = (options?: {
	checkAvailableShouldFail?: boolean;
	tags?: string[];
}) =>
	Layer.merge(
		MockCommandServiceLayer(),
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

				clone: Effect.fn("clone")(
					(_url: string, _destination: string) => Effect.void,
				),

				checkout: Effect.fn("checkout")(
					(_version: string, _cwd: string) => Effect.void,
				),

				listRemoteTags: Effect.fn("listRemoteTags")((_repoUrl: string) =>
					Effect.succeed(options?.tags || ["v1.0.0", "v2.0.0"]),
				),
			}),
		),
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
					yield* Ref.update(output, (lines) => [
						...lines,
						`[SUCCESS] ${message}`,
					]);
				}),

				writeError: Effect.fn("writeError")(function* (message: string) {
					yield* Ref.update(output, (lines) => [
						...lines,
						`[ERROR] ${message}`,
					]);
				}),

				writeInfo: Effect.fn("writeInfo")(function* (message: string) {
					yield* Ref.update(output, (lines) => [...lines, `[INFO] ${message}`]);
				}),

				writeColored: Effect.fn("writeColored")(function* (
					message: string,
					_color: string,
				) {
					yield* Ref.update(output, (lines) => [...lines, message]);
				}),

				confirm: Effect.fn("confirm")(function* (_message: string) {
					return yield* Ref.get(confirmResponse);
				}),

				readLine: Effect.fn("readLine")(() => Effect.succeed("test input")),
			});
		}),
	);

/**
 * Mock FileSystemService with in-memory storage
 */
export const MockFileSystemServiceLayer = (
	initialFiles?: Record<string, unknown>,
) =>
	Layer.effect(
		FileSystemService,
		Effect.gen(function* () {
			const files = yield* Ref.make<Record<string, unknown>>(
				initialFiles || {},
			);

			return FileSystemService.make({
				readJson: (path: string, _schema: any) =>
					Effect.gen(function* () {
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
						return content as any;
					}),

				writeJson: Effect.fn("writeJson")(function* (path: string, data: any) {
					yield* Ref.update(files, (f) => ({ ...f, [path]: data }));
				}),

				exists: Effect.fn("exists")(function* (path: string) {
					const allFiles = yield* Ref.get(files);
					return path in allFiles;
				}),

				mkdir: Effect.fn("mkdir")(
					(_path: string, _options?: any) => Effect.void,
				),

				rm: Effect.fn("rm")(function* (path: string, _options?: any) {
					yield* Ref.update(files, (f) => {
						const { [path]: _, ...rest } = f;
						return rest;
					});
				}),

				readdir: Effect.fn("readdir")((_path: string) => Effect.succeed([])),

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

				writeFileString: Effect.fn("writeFileString")(function* (
					path: string,
					content: string,
				) {
					yield* Ref.update(files, (f) => ({ ...f, [path]: content }));
				}),

				extractTarball: Effect.fn("extractTarball")(
					(_stream: any, _options?: any) => Effect.void,
				),
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
			fetchJson: (url: string, _schema: any) =>
				Effect.gen(function* () {
					const response = responses?.[url];
					if (!response) {
						return yield* Effect.fail(
							new HttpError({
								message: `No mock response for ${url}`,
								url,
							}),
						);
					}
					return response as any;
				}),

			fetchStream: Effect.fn("fetchStream")((_url: string) =>
				Effect.succeed(undefined as any),
			),

			fetch: Effect.fn("fetch")((_url: string, _options?: any) =>
				Effect.succeed({} as any),
			),
		}),
	);

/**
 * Mock NpmService with CommandService dependency
 */
export const MockNpmServiceLayer = (packages?: Record<string, string[]>) =>
	Layer.merge(
		MockCommandServiceLayer(),
		Layer.succeed(
			NpmService,
			NpmService.make({
				listVersions: Effect.fn("listVersions")((packageName: string) =>
					Effect.succeed(packages?.[packageName] || ["1.0.0", "2.0.0"]),
				),

				getRelease: Effect.fn("getRelease")(
					(_packageName: string, version: string) =>
						Effect.succeed({
							dist: {
								tarball: `https://registry.npmjs.org/pkg/-/pkg-${version}.tgz`,
							},
						}),
				),

				install: Effect.fn("install")(
					(_cwd: string, _production?: boolean) => Effect.void,
				),

				yarnInstall: Effect.fn("yarnInstall")(
					(_cwd: string, _production?: boolean) => Effect.void,
				),
			}),
		),
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

	return Layer.succeed(MockPathServiceTag, {
		pathContainsNodeCG: Effect.fn("pathContainsNodeCG")((_path: string) =>
			Effect.succeed(options?.containsNodeCG ?? false),
		),

		getNodeCGPath: Effect.fn("getNodeCGPath")(() =>
			Effect.succeed(options?.nodecgPath || "/mock/nodecg"),
		),

		isBundleFolder: Effect.fn("isBundleFolder")((_path: string) =>
			Effect.succeed(options?.isBundle ?? true),
		),

		getCurrentNodeCGVersion: Effect.fn("getCurrentNodeCGVersion")(() =>
			Effect.succeed(options?.currentVersion || "1.0.0"),
		),
	});
};

/**
 * Mock PackageResolverService with configurable behavior
 */
export const MockPackageResolverServiceLayer = () => {
	const MockPackageResolverTag = Context.GenericTag<{
		resolveGitUrl: (
			spec: string,
		) => Effect.Effect<{ url: string; name: string }>;
		parseVersionSpec: (
			spec: string,
		) => Effect.Effect<{ repo: string; range: string }>;
	}>("PackageResolverService");

	return Layer.succeed(MockPackageResolverTag, {
		resolveGitUrl: Effect.fn("resolveGitUrl")((spec: string) => {
			const name = spec.split("/").pop()?.replace(".git", "") || "test-bundle";
			return Effect.succeed({
				url: `https://github.com/test/${name}.git`,
				name,
			});
		}),

		parseVersionSpec: Effect.fn("parseVersionSpec")((spec: string) => {
			if (spec.indexOf("#") <= 0) {
				return Effect.succeed({ repo: spec, range: "" });
			}
			const [repo, range] = spec.split("#");
			return Effect.succeed({ repo: repo || spec, range: range || "" });
		}),
	});
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

	return Layer.succeed(MockJsonSchemaTag, {
		applyDefaults: Effect.fn("applyDefaults")((_schemaPath: string) =>
			Effect.succeed(defaultData || { defaultKey: "defaultValue" }),
		),

		validate: Effect.fn("validate")(
			(_data: unknown, _schemaPath: string) => Effect.void,
		),

		compileToTypeScript: Effect.fn("compileToTypeScript")(
			(_schemaPath: string, _outputPath: string, _options?: any) => Effect.void,
		),
	});
};
