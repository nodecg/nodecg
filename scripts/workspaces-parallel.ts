import * as cli from "@effect/cli";
import { Command, FileSystem, Path } from "@effect/platform";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Array, Data, Effect, Fiber, Predicate, Schema } from "effect";

const arg = cli.Args.text({ name: "command" });

const PackageJsonSchema = Schema.Struct({
	workspaces: Schema.Array(Schema.String),
});
const decodePackageJson = Schema.decode(Schema.parseJson(PackageJsonSchema));

const WorkspacePackageJsonSchema = Schema.Struct({
	scripts: Schema.Record({ key: Schema.String, value: Schema.String }).pipe(
		Schema.optional,
	),
});
const decodeWorkspacePackageJson = Schema.decode(
	Schema.parseJson(WorkspacePackageJsonSchema),
);

const command = cli.Command.make(
	"workspaces-parallel",
	{ arg },
	Effect.fn("workspaces-parallel")(function* ({ arg }) {
		const path = yield* Path.Path;
		const fs = yield* FileSystem.FileSystem;
		const packageJsonPath = path.join(import.meta.dirname, "../package.json");
		const packageJson = yield* decodePackageJson(
			yield* fs.readFileString(packageJsonPath),
		);
		const fibers = yield* Effect.all(
			packageJson.workspaces.map(
				Effect.fn(function* (workspace) {
					const workspacePath = path.join(import.meta.dirname, "..", workspace);
					const workspacePackageJsonPath = path.join(
						workspacePath,
						"package.json",
					);
					const workspacePackageJson = yield* decodeWorkspacePackageJson(
						yield* fs.readFileString(workspacePackageJsonPath),
					);
					if (!workspacePackageJson.scripts?.[arg]) {
						return;
					}
					const commandEffect = Command.make("npm", "run", arg).pipe(
						Command.workingDirectory(workspacePath),
						Command.stdout("inherit"),
						Command.stderr("inherit"),
						Command.exitCode,
						Effect.map((exitCode) =>
							exitCode === 0 ? null : { exitCode, workspace },
						),
					);
					return yield* Effect.fork(commandEffect);
				}),
			),
			{ concurrency: "unbounded" },
		);
		const results = yield* Fiber.joinAll(
			fibers.filter(Predicate.isNotNullable),
		);
		const nonZeroExits = results
			.filter(Predicate.isNotNullable)
			.filter(({ exitCode }) => exitCode !== 0)
			.map(({ workspace }) => workspace);
		if (Array.isNonEmptyReadonlyArray(nonZeroExits)) {
			return yield* Effect.fail(
				new CommandFailedError({ workspaces: nonZeroExits }),
			);
		}
	}, Effect.scoped),
);

NodeRuntime.runMain(
	cli.Command.run(command, {
		name: "workspaces-parallel",
		version: "0.0.0",
	})(process.argv).pipe(Effect.provide(NodeContext.layer)),
);

class CommandFailedError extends Data.TaggedError("CommandFailedError")<{
	workspaces: Array.NonEmptyReadonlyArray<string>;
}> {
	override readonly message = `Command failed in workspaces: ${this.workspaces.join(", ")}`;
	override cause = this.workspaces;
}
