import { describe, it, expect } from "vitest";
import { Effect, Schema } from "effect";
import { FileSystemService, FileSystemError } from "../../src/services/file-system.js";
import { runEffect, runEffectExpectError } from "../helpers/test-runner.js";
import { MockFileSystemServiceLayer } from "../helpers/mock-services.js";

describe("FileSystemService", () => {
	describe("readJson", () => {
		it("should read valid JSON file", async () => {
			const testData = { name: "test", version: "1.0.0" };
			const schema = Schema.Struct({
				name: Schema.String,
				version: Schema.String,
			});

			const effect = Effect.gen(function* () {
				const fs = yield* FileSystemService;
				const data = yield* fs.readJson("/test/package.json", schema);
				return data;
			});

			const testLayer = MockFileSystemServiceLayer({
				"/test/package.json": testData,
			});

			const result = await runEffect(effect, testLayer);
			expect(result).toEqual(testData);
		});

		it("should handle complex nested JSON structures", async () => {
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
				dependencies: Schema.Record({ key: Schema.String, value: Schema.String }),
				scripts: Schema.Record({ key: Schema.String, value: Schema.String }),
			});

			const effect = Effect.gen(function* () {
				const fs = yield* FileSystemService;
				const data = yield* fs.readJson("/test/package.json", schema);
				return data;
			});

			const testLayer = MockFileSystemServiceLayer({
				"/test/package.json": testData,
			});

			const result = await runEffect(effect, testLayer);
			expect(result).toEqual(testData);
		});
	});

	describe("writeJson", () => {
		it("should write JSON file", async () => {
			const testData = { name: "test", version: "1.0.0" };

			const effect = Effect.gen(function* () {
				const fs = yield* FileSystemService;
				yield* fs.writeJson("/test/output.json", testData);
			});

			const testLayer = MockFileSystemServiceLayer();
			await runEffect(effect, testLayer);
		});

		it("should write complex nested structures", async () => {
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

			const effect = Effect.gen(function* () {
				const fs = yield* FileSystemService;
				yield* fs.writeJson("/test/complex.json", testData);
			});

			const testLayer = MockFileSystemServiceLayer();
			await runEffect(effect, testLayer);
		});
	});

	describe("exists", () => {
		it("should return true for existing file", async () => {
			const effect = Effect.gen(function* () {
				const fs = yield* FileSystemService;
				const exists = yield* fs.exists("/test/existing.txt");
				return exists;
			});

			const testLayer = MockFileSystemServiceLayer({
				"/test/existing.txt": "content",
			});

			const result = await runEffect(effect, testLayer);
			expect(result).toBe(true);
		});

		it("should return false for non-existing file", async () => {
			const effect = Effect.gen(function* () {
				const fs = yield* FileSystemService;
				const exists = yield* fs.exists("/test/nonexistent.txt");
				return exists;
			});

			const testLayer = MockFileSystemServiceLayer();

			const result = await runEffect(effect, testLayer);
			expect(result).toBe(false);
		});
	});

	describe("rm", () => {
		it("should remove file", async () => {
			const effect = Effect.gen(function* () {
				const fs = yield* FileSystemService;
				// Verify file exists first
				const existsBefore = yield* fs.exists("/test/file.txt");
				// Remove file
				yield* fs.rm("/test/file.txt");
				// Verify file no longer exists
				const existsAfter = yield* fs.exists("/test/file.txt");
				return { existsBefore, existsAfter };
			});

			const testLayer = MockFileSystemServiceLayer({
				"/test/file.txt": "content",
			});

			const { existsBefore, existsAfter } = await runEffect(effect, testLayer);
			expect(existsBefore).toBe(true);
			expect(existsAfter).toBe(false);
		});

		it("should handle recursive removal", async () => {
			const effect = Effect.gen(function* () {
				const fs = yield* FileSystemService;
				yield* fs.rm("/test/directory", { recursive: true, force: true });
			});

			const testLayer = MockFileSystemServiceLayer({
				"/test/directory/file.txt": "content",
			});

			await runEffect(effect, testLayer);
		});
	});

	describe("readFileString", () => {
		it("should read string file", async () => {
			const effect = Effect.gen(function* () {
				const fs = yield* FileSystemService;
				const content = yield* fs.readFileString("/test/file.txt");
				return content;
			});

			const testLayer = MockFileSystemServiceLayer({
				"/test/file.txt": "Hello, World!",
			});

			const result = await runEffect(effect, testLayer);
			expect(result).toBe("Hello, World!");
		});
	});

	describe("writeFileString", () => {
		it("should write string file", async () => {
			const effect = Effect.gen(function* () {
				const fs = yield* FileSystemService;
				yield* fs.writeFileString("/test/output.txt", "Hello, World!");
				// Verify by reading back
				const content = yield* fs.readFileString("/test/output.txt");
				return content;
			});

			const testLayer = MockFileSystemServiceLayer();

			const result = await runEffect(effect, testLayer);
			expect(result).toBe("Hello, World!");
		});
	});

	describe("mkdir", () => {
		it("should create directory", async () => {
			const effect = Effect.gen(function* () {
				const fs = yield* FileSystemService;
				yield* fs.mkdir("/test/newdir");
			});

			const testLayer = MockFileSystemServiceLayer();
			await runEffect(effect, testLayer);
		});

		it("should create directory recursively", async () => {
			const effect = Effect.gen(function* () {
				const fs = yield* FileSystemService;
				yield* fs.mkdir("/test/deep/nested/directory", { recursive: true });
			});

			const testLayer = MockFileSystemServiceLayer();
			await runEffect(effect, testLayer);
		});
	});

	describe("readdir", () => {
		it("should read directory", async () => {
			const effect = Effect.gen(function* () {
				const fs = yield* FileSystemService;
				const files = yield* fs.readdir("/test");
				return files;
			});

			const testLayer = MockFileSystemServiceLayer();

			const result = await runEffect(effect, testLayer);
			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe("Effect.fn usage", () => {
		it("should allow calling methods multiple times", async () => {
			const effect = Effect.gen(function* () {
				const fs = yield* FileSystemService;

				// Write multiple files
				yield* fs.writeFileString("/test/file1.txt", "Content 1");
				yield* fs.writeFileString("/test/file2.txt", "Content 2");

				// Read them back
				const content1 = yield* fs.readFileString("/test/file1.txt");
				const content2 = yield* fs.readFileString("/test/file2.txt");

				// Check existence multiple times
				const exists1 = yield* fs.exists("/test/file1.txt");
				const exists2 = yield* fs.exists("/test/file2.txt");
				const exists3 = yield* fs.exists("/test/nonexistent.txt");

				return { content1, content2, exists1, exists2, exists3 };
			});

			const testLayer = MockFileSystemServiceLayer();

			const result = await runEffect(effect, testLayer);
			expect(result.content1).toBe("Content 1");
			expect(result.content2).toBe("Content 2");
			expect(result.exists1).toBe(true);
			expect(result.exists2).toBe(true);
			expect(result.exists3).toBe(false);
		});
	});
});
