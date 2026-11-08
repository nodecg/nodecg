import { type ChildProcess, fork } from "node:child_process";

import * as NodeServices from "@effect/platform-node/NodeServices";
import { OperatingSystemService } from "@nodecg/server";
import {
	Cause,
	Duration,
	Effect,
	FiberSet,
	FileSystem,
	HashMap,
	Layer,
	ManagedRuntime,
	Match,
	Option,
	Path,
	Schema,
	SynchronizedRef,
} from "effect";
import type { TestProject } from "vitest/node";

import {
	Restarted,
	RestartError,
	restartChannelName,
	RestartRequest,
} from "./restart-channel.ts";

const BackendSchema = Schema.Struct({
	name: Schema.String,
	serverEntry: Schema.String,
	port: Schema.Int,
	superadmins: Schema.String,
	baseUrl: Schema.String,
	otlpEndpoint: Schema.String,
});
export type Backend = typeof BackendSchema.Type;

export const decodeBackends = Schema.decodeUnknownSync(
	Schema.fromJsonString(Schema.Array(BackendSchema)),
);

const isRestartRequest = Schema.is(RestartRequest);

const exited = (child: ChildProcess) =>
	child.exitCode !== null || child.signalCode !== null;

const onceExit = (child: ChildProcess): Effect.Effect<void> =>
	Effect.callback((resume) => {
		if (exited(child)) {
			resume(Effect.void);
			return;
		}
		const handler = () => resume(Effect.void);
		child.once("exit", handler);
		return Effect.sync(() => child.removeListener("exit", handler));
	});

class SuiteServerExited extends Schema.TaggedError<SuiteServerExited>()(
	"SuiteServerExited",
	{ name: Schema.String, code: Schema.NullOr(Schema.Int) },
) {
	override readonly message = `suite server ${this.name} exited before ready (${this.code})`;
}

const forkServer = (backend: Backend, dataDir: string) =>
	Effect.callback<ChildProcess, SuiteServerExited, OperatingSystemService>(
		(resume) => {
			const child = fork(backend.serverEntry, {
				env: {
					NODECG_PORT: String(backend.port),
					NODECG_BASE_URL: backend.baseUrl,
					NODECG_DATA_DIR: dataDir,
					NODECG_SUPERADMINS: backend.superadmins,
					OTEL_EXPORTER_OTLP_ENDPOINT: backend.otlpEndpoint,
				},
				stdio: ["ignore", "inherit", "inherit", "ipc"],
			});
			let settled = false;
			child.once("message", (message: { type?: string }) => {
				if (message.type === "ready" && !settled) {
					settled = true;
					resume(Effect.succeed(child));
				}
			});
			child.once("exit", (code) => {
				if (!settled) {
					settled = true;
					resume(
						Effect.fail(new SuiteServerExited({ name: backend.name, code })),
					);
				}
			});
			return stopChild(child);
		},
	);

const stopChild = (child: ChildProcess) =>
	Effect.gen(function* () {
		if (exited(child)) {
			return;
		}
		Match.value(yield* OperatingSystemService).pipe(
			Match.when("windows", () => child.send("shutdown")),
			Match.whenOr("macos", "linux", () => child.kill()),
			Match.exhaustive,
		);
		yield* onceExit(child).pipe(
			Effect.timeoutOrElse({
				duration: Duration.seconds(2),
				orElse: () =>
					Effect.gen(function* () {
						child.kill("SIGKILL");
						yield* onceExit(child);
					}),
			}),
		);
	});

interface SuiteServer {
	readonly backend: Backend;
	readonly dataDir: string;
	readonly child: SynchronizedRef.SynchronizedRef<ChildProcess>;
}

const restartServer = Effect.fn(function* (server: SuiteServer) {
	yield* SynchronizedRef.updateEffect(server.child, (current) =>
		Effect.gen(function* () {
			yield* stopChild(current);
			return yield* forkServer(server.backend, server.dataDir);
		}),
	);
});

export default async function setup(project: TestProject) {
	const backends = decodeBackends(project.config.env["E2E_BACKENDS"]);
	const runtime = Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const path = yield* Path.Path;
		const dataRoot = yield* fs.makeTempDirectoryScoped({
			prefix: "nodecg-e2e-",
		});
		const servers = HashMap.fromIterable(
			yield* Effect.forEach(
				backends,
				(backend) =>
					Effect.gen(function* () {
						const dataDir = path.join(dataRoot, backend.name);
						const child = yield* Effect.acquireRelease(
							Effect.gen(function* () {
								const forked = yield* forkServer(backend, dataDir);
								return yield* SynchronizedRef.make(forked);
							}),
							(child) =>
								Effect.gen(function* () {
									yield* stopChild(yield* SynchronizedRef.get(child));
								}),
						);
						const server: SuiteServer = { backend, dataDir, child };
						return [backend.port, server] as const;
					}),
				{ concurrency: "unbounded" },
			),
		);
		const runPromise =
			yield* FiberSet.makeRuntimePromise<OperatingSystemService>();
		const channel = yield* Effect.acquireRelease(
			Effect.sync(() => new BroadcastChannel(restartChannelName)),
			(channel) => Effect.sync(() => channel.close()),
		);
		channel.onmessage = ({ data }) => {
			if (!isRestartRequest(data)) {
				return;
			}
			const server = HashMap.get(servers, data.port);
			if (Option.isNone(server)) {
				return;
			}
			void runPromise(
				Effect.gen(function* () {
					const reply = yield* restartServer(server.value).pipe(
						Effect.matchCause({
							onSuccess: () => Restarted.make({ port: data.port }),
							onFailure: (cause) =>
								RestartError.make({
									port: data.port,
									message: Cause.pretty(cause),
								}),
						}),
					);
					channel.postMessage(reply);
				}),
			);
		};
	}).pipe(
		Layer.effectDiscard,
		Layer.provide(
			Layer.merge(NodeServices.layer, OperatingSystemService.layer),
		),
		ManagedRuntime.make,
	);
	await runtime.context();
	return () => runtime.dispose();
}
