import { it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { describe, expect } from "vitest";

import { MockFileSystemServiceLayer } from "../helpers/mock-services.js";
import { FileSystemService } from "./file-system.js";

describe("FileSystemService", () => {
	describe("readJson", () => {
		it.effect("should read valid JSON file", () =>
			Effect.gen(function* () {
				const testData = { name: "test", version: "1.0.0" };
				const schema = Schema.Struct({
					name: Schema.String,
					version: Schema.String,
				});

				const fs = yield* FileSystemService;
				const data = yield* fs.readJson("/test/package.json", schema);
				expect(data).toEqual(testData);
			}).pipe(
				Effect.provide(
					MockFileSystemServiceLayer({
						"/test/package.json": { name: "test", version: "1.0.0" },
					}),
				),
			),
		);

		it.effect("should handle complex nested JSON structures", () =>
			Effect.gen(function* () {
				const testData = {
					name: "test",
					dependencies: {
						"package-a": "1.0.0",
						"package-b": "2.0.0",
					},
					scripts: {
						build: "npm run build",
						test: "npm test",
					},
				};

				const schema = Schema.Struct({
					name: Schema.String,
					dependencies: Schema.Record({
						key: Schema.String,
						value: Schema.String,
					}),
					scripts: Schema.Record({ key: Schema.String, value: Schema.String }),
				});

				const fs = yield* FileSystemService;
				const data = yield* fs.readJson("/test/package.json", schema);
				expect(data).toEqual(testData);
			}).pipe(
				Effect.provide(
					MockFileSystemServiceLayer({
						"/test/package.json": {
							name: "test",
							dependencies: {
								"package-a": "1.0.0",
								"package-b": "2.0.0",
							},
							scripts: {
								build: "npm run build",
								test: "npm test",
							},
						},
					}),
				),
			),
		);
	});

	describe("writeJson", () => {
		it.effect("should write JSON file", () =>
			Effect.gen(function* () {
				const testData = { name: "test", version: "1.0.0" };
				const fs = yield* FileSystemService;
				yield* fs.writeJson("/test/output.json", testData);
			}).pipe(Effect.provide(MockFileSystemServiceLayer())),
		);

		it.effect("should write complex nested structures", () =>
			Effect.gen(function* () {
				const testData = {
					name: "test",
					config: {
						nested: {
							deep: {
								value: true,
							},
						},
					},
					items: ["a", "b", "c"],
				};

				const fs = yield* FileSystemService;
				yield* fs.writeJson("/test/complex.json", testData);
			}).pipe(Effect.provide(MockFileSystemServiceLayer())),
		);
	});

	describe("exists", () => {
		it.effect("should return true for existing file", () =>
			Effect.gen(function* () {
				const fs = yield* FileSystemService;
				const exists = yield* fs.exists("/test/existing.txt");
				expect(exists).toBe(true);
			}).pipe(
				Effect.provide(
					MockFileSystemServiceLayer({
						"/test/existing.txt": "content",
					}),
				),
			),
		);

		it.effect("should return false for non-existing file", () =>
			Effect.gen(function* () {
				const fs = yield* FileSystemService;
				const exists = yield* fs.exists("/test/nonexistent.txt");
				expect(exists).toBe(false);
			}).pipe(Effect.provide(MockFileSystemServiceLayer())),
		);
	});

	describe("rm", () => {
		it.effect("should remove file", () =>
			Effect.gen(function* () {
				const fs = yield* FileSystemService;
				const existsBefore = yield* fs.exists("/test/file.txt");
				yield* fs.rm("/test/file.txt");
				const existsAfter = yield* fs.exists("/test/file.txt");
				expect(existsBefore).toBe(true);
				expect(existsAfter).toBe(false);
			}).pipe(
				Effect.provide(
					MockFileSystemServiceLayer({
						"/test/file.txt": "content",
					}),
				),
			),
		);

		it.effect("should handle recursive removal", () =>
			Effect.gen(function* () {
				const fs = yield* FileSystemService;
				yield* fs.rm("/test/directory", { recursive: true, force: true });
			}).pipe(
				Effect.provide(
					MockFileSystemServiceLayer({
						"/test/directory/file.txt": "content",
					}),
				),
			),
		);
	});

	describe("readFileString", () => {
		it.effect("should read string file", () =>
			Effect.gen(function* () {
				const fs = yield* FileSystemService;
				const content = yield* fs.readFileString("/test/file.txt");
				expect(content).toBe("Hello, World!");
			}).pipe(
				Effect.provide(
					MockFileSystemServiceLayer({
						"/test/file.txt": "Hello, World!",
					}),
				),
			),
		);
	});

	describe("writeFileString", () => {
		it.effect("should write string file", () =>
			Effect.gen(function* () {
				const fs = yield* FileSystemService;
				yield* fs.writeFileString("/test/output.txt", "Hello, World!");
				const content = yield* fs.readFileString("/test/output.txt");
				expect(content).toBe("Hello, World!");
			}).pipe(Effect.provide(MockFileSystemServiceLayer())),
		);
	});

	describe("mkdir", () => {
		it.effect("should create directory", () =>
			Effect.gen(function* () {
				const fs = yield* FileSystemService;
				yield* fs.mkdir("/test/newdir");
			}).pipe(Effect.provide(MockFileSystemServiceLayer())),
		);

		it.effect("should create directory recursively", () =>
			Effect.gen(function* () {
				const fs = yield* FileSystemService;
				yield* fs.mkdir("/test/deep/nested/directory", { recursive: true });
			}).pipe(Effect.provide(MockFileSystemServiceLayer())),
		);
	});

	describe("readdir", () => {
		it.effect("should read directory", () =>
			Effect.gen(function* () {
				const fs = yield* FileSystemService;
				const files = yield* fs.readdir("/test");
				expect(Array.isArray(files)).toBe(true);
			}).pipe(Effect.provide(MockFileSystemServiceLayer())),
		);
	});

	describe("Effect.fn usage", () => {
		it.effect("should allow calling methods multiple times", () =>
			Effect.gen(function* () {
				const fs = yield* FileSystemService;

				yield* fs.writeFileString("/test/file1.txt", "Content 1");
				yield* fs.writeFileString("/test/file2.txt", "Content 2");

				const content1 = yield* fs.readFileString("/test/file1.txt");
				const content2 = yield* fs.readFileString("/test/file2.txt");

				const exists1 = yield* fs.exists("/test/file1.txt");
				const exists2 = yield* fs.exists("/test/file2.txt");
				const exists3 = yield* fs.exists("/test/nonexistent.txt");

				expect(content1).toBe("Content 1");
				expect(content2).toBe("Content 2");
				expect(exists1).toBe(true);
				expect(exists2).toBe(true);
				expect(exists3).toBe(false);
			}).pipe(Effect.provide(MockFileSystemServiceLayer())),
		);
	});
});
