import { Effect, Data, Stream } from "effect";
import { FileSystem } from "@effect/platform";
import { Schema } from "@effect/schema";
import * as tar from "tar";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

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
				readJson: Effect.fn("readJson")<A, I, R>(function* (
					path: string,
					schema: Schema.Schema<A, I, R>,
				) {
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
				}),

				writeJson: Effect.fn("writeJson")<A>(function* (path: string, data: A) {
					yield* fs.writeFileString(path, JSON.stringify(data, null, 2)).pipe(
						Effect.mapError(
							() =>
								new FileSystemError({
									message: `Failed to write ${path}`,
									path,
								}),
						),
					);
				}),

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

				extractTarball: Effect.fn("extractTarball")<E>(function* (
					stream: Stream.Stream<Uint8Array, E, never>,
					options?: { cwd?: string; strip?: number },
				) {
					// Convert Stream to ReadableStream
					const readableStream = Stream.toReadableStream(stream);

					// Convert Web ReadableStream to Node Readable
					const nodeReadable = Readable.fromWeb(
						readableStream as import("stream/web").ReadableStream,
					);

					yield* Effect.promise(() =>
						pipeline(nodeReadable, tar.x({ cwd: options?.cwd, strip: options?.strip })),
					).pipe(
						Effect.mapError(
							() =>
								new FileSystemError({
									message: `Failed to extract tarball`,
								}),
						),
					);
				}),
			};
		}),
	},
) {}
