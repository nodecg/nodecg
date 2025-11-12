import { Effect, Data } from "effect";
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
					}),

				writeJson: <A>(path: string, data: A) =>
					Effect.gen(function* () {
						yield* fs
							.writeFileString(path, JSON.stringify(data, null, 2))
							.pipe(
								Effect.mapError(
									() =>
										new FileSystemError({
											message: `Failed to write ${path}`,
											path,
										}),
								),
							);
					}),

				exists: (path: string) =>
					Effect.gen(function* () {
						return yield* fs.exists(path).pipe(Effect.orElseSucceed(() => false));
					}),

				mkdir: (path: string, options?: { recursive?: boolean }) =>
					Effect.gen(function* () {
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

				rm: (path: string, options?: { recursive?: boolean; force?: boolean }) =>
					Effect.gen(function* () {
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

				readdir: (path: string) =>
					Effect.gen(function* () {
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

				readFileString: (path: string) =>
					Effect.gen(function* () {
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

				writeFileString: (path: string, content: string) =>
					Effect.gen(function* () {
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

				extractTarball: (
					stream: AsyncIterable<Uint8Array>,
					options?: { cwd?: string; strip?: number },
				) =>
					Effect.gen(function* () {
						yield* Effect.promise(() =>
							pipeline(
								Readable.from(stream),
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
					}),
			};
		}),
	},
) {}
