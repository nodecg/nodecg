import { expect, test } from "vitest";

import { isChildPath } from "./is-child-path";

test("same path", () => {
	expect(isChildPath("/", "/")).toBe(false);
	expect(isChildPath("/a/b/c", "/a/b/c")).toBe(false);
});

test("throws for non-absolute paths", () => {
	expect(() => isChildPath("a", "/b")).toThrow();
	expect(() => isChildPath("/a", "b")).toThrow();
	expect(() => isChildPath("a", "b")).toThrow();
});

test("child path", () => {
	expect(isChildPath("/a/b/c", "/a/b/c/d")).toBe(true);
	expect(isChildPath("/a/b/c", "/a/b/c/d/e")).toBe(true);
	expect(isChildPath("/a/b/c", "/a/b/c/d/e/f")).toBe(true);
});

test("not child path", () => {
	expect(isChildPath("/a/b/c", "/a/b")).toBe(false);
	expect(isChildPath("/a/b/c", "/a")).toBe(false);
	expect(isChildPath("/a/b/c", "/a/b/cd")).toBe(false);
	expect(isChildPath("/a/b/c", "/a/b/cd/e")).toBe(false);
	expect(isChildPath("/a/b/c", "/a/b/cd/e/f")).toBe(false);
});
