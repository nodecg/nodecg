#!/usr/bin/env node
import { Effect, Layer } from "effect";
import {
	NodeFileSystem,
	NodeHttpClient,
	NodeTerminal,
	NodeContext,
	NodePath,
	NodeRuntime,
} from "@effect/platform-node";
import { cli } from "../index.js";
import { FileSystemService } from "../services/file-system.js";
import { TerminalService } from "../services/terminal.js";
import { HttpService } from "../services/http.js";
import { CommandService } from "../services/command.js";
import { GitService } from "../services/git.js";
import { NpmService } from "../services/npm.js";
import { JsonSchemaService } from "../services/json-schema.js";
import { PackageResolverService } from "../services/package-resolver.js";
import { PathService } from "../services/path.js";

const program = Effect.gen(function* () {
	const git = yield* GitService;
	const terminal = yield* TerminalService;

	// Check git availability
	yield* git.checkAvailable().pipe(
		Effect.catchAll(() =>
			Effect.gen(function* () {
				yield* terminal.writeError(
					"The CLI requires that git be available in your PATH.",
				);
				return yield* Effect.fail(new Error("git not available"));
			}),
		),
	);

	// Set process title
	yield* Effect.sync(() => {
		process.title = "nodecg";
	});

	// Run CLI
	yield* cli(process.argv);
});

const MainLayer = Layer.mergeAll(
	NodeContext.layer,
	NodeFileSystem.layer,
	NodeHttpClient.layerWithoutAgent,
	NodeTerminal.layer,
	NodePath.layer,
).pipe(
	Layer.provideMerge(FileSystemService.Default),
	Layer.provideMerge(TerminalService.Default),
	Layer.provideMerge(HttpService.Default),
	Layer.provideMerge(CommandService.Default),
	Layer.provideMerge(GitService.Default),
	Layer.provideMerge(NpmService.Default),
	Layer.provideMerge(JsonSchemaService.Default),
	Layer.provideMerge(PackageResolverService.Default),
	Layer.provideMerge(PathService.Default),
);

const runnable = program.pipe(
	Effect.provide(MainLayer),
	Effect.catchAllDefect((defect) => {
		console.error("Fatal error:", defect);
		return Effect.sync(() => process.exit(1));
	}),
	Effect.catchAll((error) => {
		console.error("Error:", error);
		return Effect.sync(() => process.exit(1));
	}),
);

NodeRuntime.runMain(runnable as Effect.Effect<void, never, never>);
