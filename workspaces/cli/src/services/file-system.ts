import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { FileSystem } from "@effect/platform";
import { Data, Effect, Schema, Stream } from "effect";
import * as tar from "tar";

export class FileSystemError extends Data.TaggedError("FileSystemError")<{
	readonly message: string;
	readonly path?: string;
}> {}

export class FileSystemService extends Effect.Service<FileSystemService>()(
	"FileSystemService",
	{
		effect: Effect.gen(function* () {
			const fs = yield* FileSystem.FileSystem;

			return {
				readJson: <A, I, R>(path: string, schema: Schema.Schema<A, I, R>) =>
					Effect.gen(function* () {
						const content = yield* fs.readFileString(path).pipe(
							Effect.mapError(
								() =>
									new FileSystemError({
										message: `Failed to read ${path}`,
										path,
									}),
							),
						);
						const parsed = JSON.parse(content);
						return yield* Schema.decodeUnknown(schema)(parsed).pipe(
							Effect.mapError(
								() =>
									new FileSystemError({
										message: `Invalid JSON in ${path}`,
										path,
									}),
							),
						);
					}).pipe(Effect.withSpan("readJson")),

				writeJson: <A>(path: string, data: A) =>
					Effect.gen(function* () {
						yield* fs.writeFileString(path, JSON.stringify(data, null, 2)).pipe(
							Effect.mapError(
								() =>
									new FileSystemError({
										message: `Failed to write ${path}`,
										path,
									}),
							),
						);
					}).pipe(Effect.withSpan("writeJson")),

				exists: Effect.fn("exists")(function* (path: string) {
					return yield* fs.exists(path).pipe(Effect.orElseSucceed(() => false));
				}),

				mkdir: Effect.fn("mkdir")(function* (
					path: string,
					options?: { recursive?: boolean },
				) {
					yield* fs.makeDirectory(path, options).pipe(
						Effect.mapError(
							() =>
								new FileSystemError({
									message: `Failed to create ${path}`,
									path,
								}),
						),
					);
				}),

				rm: Effect.fn("rm")(function* (
					path: string,
					options?: { recursive?: boolean; force?: boolean },
				) {
					yield* fs.remove(path, options).pipe(
						Effect.mapError(
							() =>
								new FileSystemError({
									message: `Failed to remove ${path}`,
									path,
								}),
						),
					);
				}),

				readdir: Effect.fn("readdir")(function* (path: string) {
					return yield* fs.readDirectory(path).pipe(
						Effect.mapError(
							() =>
								new FileSystemError({
									message: `Failed to read directory ${path}`,
									path,
								}),
						),
					);
				}),

				readFileString: Effect.fn("readFileString")(function* (path: string) {
					return yield* fs.readFileString(path).pipe(
						Effect.mapError(
							() =>
								new FileSystemError({
									message: `Failed to read ${path}`,
									path,
								}),
						),
					);
				}),

				writeFileString: Effect.fn("writeFileString")(function* (
					path: string,
					content: string,
				) {
					yield* fs.writeFileString(path, content).pipe(
						Effect.mapError(
							() =>
								new FileSystemError({
									message: `Failed to write ${path}`,
									path,
								}),
						),
					);
				}),

				extractTarball: <E>(
					stream: Stream.Stream<Uint8Array, E, never>,
					options?: { cwd?: string; strip?: number },
				) =>
					Effect.gen(function* () {
						// Convert Stream to ReadableStream
						const readableStream = Stream.toReadableStream(stream);

						// Convert Web ReadableStream to Node Readable
						const nodeReadable = Readable.fromWeb(
							readableStream as import("stream/web").ReadableStream,
						);

						yield* Effect.promise(() =>
							pipeline(
								nodeReadable,
								tar.x({ cwd: options?.cwd, strip: options?.strip }),
							),
						).pipe(
							Effect.mapError(
								() =>
									new FileSystemError({
										message: `Failed to extract tarball`,
									}),
							),
						);
					}).pipe(Effect.withSpan("extractTarball")),
			};
		}),
	},
) {}
