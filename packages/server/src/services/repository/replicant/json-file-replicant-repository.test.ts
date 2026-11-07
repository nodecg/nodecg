import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { testLayer } from "@nodecg-next/test-utils";
import {
	ConfigProvider,
	Context,
	Deferred,
	Effect,
	Fiber,
	FileSystem,
	Layer,
	Path,
	PlatformError,
	Schema,
} from "effect";
import { TestClock } from "effect/testing";
import { afterEach, assert, describe, expect, vi } from "vitest";

import { config } from "../../../server-config.ts";
import { OperatingSystemService } from "../../operating-system/operating-system.ts";
import { BackendError } from "../repository-errors.ts";
import { JsonFileReplicantRepository } from "./json-file-replicant-repository.ts";
import {
	DecodeError,
	ReplicantNotFound,
	ReplicantRepositoryService,
} from "./replicant-repository.ts";

const temporaryDataDir = ConfigProvider.layer(
	Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const dir = yield* fs.makeTempDirectoryScoped();
		return ConfigProvider.fromEnvRecord({ DATA_DIR: dir });
	}),
);

const test = testLayer(
	JsonFileReplicantRepository.pipe(
		Layer.provideMerge(temporaryDataDir),
		Layer.provideMerge(
			Layer.mergeAll(
				NodeFileSystem.layer,
				NodePath.layer,
				OperatingSystemService.layer,
			),
		),
	),
);

describe("read", () => {
	test(
		"fails with ReplicantNotFound on a missing key",
		Effect.gen(function* () {
			const repository = yield* ReplicantRepositoryService;
			const error = yield* repository.read("ns", "missing").pipe(Effect.flip);
			assert(Schema.is(ReplicantNotFound)(error));
			expect(error).toMatchObject({ namespace: "ns", name: "missing" });
		}),
	);

	test(
		"fails with a decode error on a file that is not JSON",
		Effect.gen(function* () {
			const repository = yield* ReplicantRepositoryService;
			const fs = yield* FileSystem.FileSystem;
			const path = yield* Path.Path;
			const dir = yield* config.dataDir;
			yield* repository.write("ns", "a", 1);
			yield* fs.writeFileString(
				path.join(dir, "replicants", "ns", "a.json"),
				"{not json",
			);

			const error = yield* repository.read("ns", "a").pipe(Effect.flip);
			assert(Schema.is(DecodeError)(error));
			expect(error).toMatchObject({ issue: "Expected a valid JSON string" });
		}),
	);
});

describe("write", () => {
	test(
		"fails with a backend error naming the path when the file cannot be written",
		Effect.gen(function* () {
			const repository = yield* ReplicantRepositoryService;
			const fs = yield* FileSystem.FileSystem;
			const path = yield* Path.Path;
			const dir = yield* config.dataDir;
			yield* fs.makeDirectory(path.join(dir, "replicants"), {
				recursive: true,
			});
			yield* fs.writeFileString(path.join(dir, "replicants", "ns"), "");

			const error = yield* repository.write("ns", "a", 1).pipe(Effect.flip);
			assert(Schema.is(BackendError)(error));
			expect(error.message).toContain(path.join(dir, "replicants", "ns"));
		}),
	);

	test(
		"stores new values that read returns",
		Effect.gen(function* () {
			const repository = yield* ReplicantRepositoryService;
			yield* repository.write("ns", "a", 1);
			yield* repository.write("ns", "b", { list: ["two"] });
			expect(yield* repository.read("ns", "a")).toBe(1);
			expect(yield* repository.read("ns", "b")).toEqual({ list: ["two"] });
		}),
	);

	test(
		"overwrites an existing value",
		Effect.gen(function* () {
			const repository = yield* ReplicantRepositoryService;
			yield* repository.write("ns", "a", 1);
			yield* repository.write("ns", "a", 2);
			expect(yield* repository.read("ns", "a")).toBe(2);
		}),
	);

	test(
		"keeps one file per replicant with no temporary file left behind",
		Effect.gen(function* () {
			const repository = yield* ReplicantRepositoryService;
			const fs = yield* FileSystem.FileSystem;
			const path = yield* Path.Path;
			const dir = yield* config.dataDir;
			yield* repository.write("ns", "a", 1);
			yield* repository.write("ns", "a", 2);

			expect(
				yield* fs.readDirectory(path.join(dir, "replicants", "ns")),
			).toEqual(["a.json"]);
			expect(
				yield* fs.readFileString(path.join(dir, "replicants", "ns", "a.json")),
			).toBe("2");
		}),
	);

	test(
		"a value written by one instance is read by a fresh one",
		Effect.gen(function* () {
			const repository = yield* ReplicantRepositoryService;
			yield* repository.write("ns", "a", { count: 3 });

			const restarted = yield* Layer.build(
				Layer.fresh(JsonFileReplicantRepository),
			);
			expect(
				yield* Context.get(restarted, ReplicantRepositoryService).read(
					"ns",
					"a",
				),
			).toEqual({ count: 3 });
		}),
	);
});

describe("write over a locked file", () => {
	const rename = vi.fn<FileSystem.FileSystem["rename"]>();
	afterEach(() => {
		rename.mockReset();
	});

	const testOn = (
		operatingSystem: Context.Service.Shape<typeof OperatingSystemService>,
	) =>
		testLayer(
			JsonFileReplicantRepository.pipe(
				Layer.provideMerge(temporaryDataDir),
				Layer.provideMerge(
					Layer.effect(
						FileSystem.FileSystem,
						Effect.gen(function* () {
							const fs = yield* FileSystem.FileSystem;
							return {
								...fs,
								rename: (from: string, to: string) =>
									Effect.suspend(() => rename(from, to)),
							};
						}),
					).pipe(Layer.provide(NodeFileSystem.layer)),
				),
				Layer.provideMerge(
					Layer.mergeAll(
						NodePath.layer,
						Layer.succeed(OperatingSystemService, operatingSystem),
					),
				),
			),
		);

	const renameError = (code: string) =>
		PlatformError.systemError({
			_tag: "Unknown",
			module: "FileSystem",
			method: "rename",
			cause: Object.assign(new Error(code), { code }),
		});

	describe("on Windows", () => {
		const test = testOn("windows");

		test(
			"retries the rename until the lock is released",
			Effect.gen(function* () {
				const repository = yield* ReplicantRepositoryService;
				const attempted = yield* Deferred.make<void>();
				rename
					.mockReturnValueOnce(
						Deferred.succeed(attempted, undefined).pipe(
							Effect.andThen(Effect.fail(renameError("EPERM"))),
						),
					)
					.mockReturnValueOnce(Effect.fail(renameError("EPERM")))
					.mockReturnValueOnce(Effect.void);

				const write = yield* Effect.forkChild(repository.write("ns", "a", 1));
				yield* Deferred.await(attempted);
				yield* TestClock.adjust("1 second");
				yield* Fiber.join(write);

				expect(rename).toHaveBeenCalledTimes(3);
			}),
		);

		test(
			"fails with a backend error once the lock outlasts a minute",
			Effect.gen(function* () {
				const repository = yield* ReplicantRepositoryService;
				const attempted = yield* Deferred.make<void>();
				rename.mockReturnValue(
					Deferred.succeed(attempted, undefined).pipe(
						Effect.andThen(Effect.fail(renameError("EPERM"))),
					),
				);

				const write = yield* Effect.forkChild(
					repository.write("ns", "a", 1).pipe(Effect.flip),
				);
				yield* Deferred.await(attempted);
				yield* TestClock.adjust("59 seconds");
				expect(write.pollUnsafe()).toBeUndefined();
				yield* TestClock.adjust("2 seconds");

				assert(Schema.is(BackendError)(yield* Fiber.join(write)));
			}),
		);

		test(
			"does not retry a rename failure other than a lock",
			Effect.gen(function* () {
				const repository = yield* ReplicantRepositoryService;
				rename.mockReturnValue(Effect.fail(renameError("ENOSPC")));

				const error = yield* repository.write("ns", "a", 1).pipe(Effect.flip);

				assert(Schema.is(BackendError)(error));
				expect(rename).toHaveBeenCalledTimes(1);
			}),
		);
	});

	describe("on other operating systems", () => {
		const test = testOn("linux");

		test(
			"does not retry the rename",
			Effect.gen(function* () {
				const repository = yield* ReplicantRepositoryService;
				rename.mockReturnValue(Effect.fail(renameError("EPERM")));

				const error = yield* repository.write("ns", "a", 1).pipe(Effect.flip);

				assert(Schema.is(BackendError)(error));
				expect(rename).toHaveBeenCalledTimes(1);
			}),
		);
	});
});
