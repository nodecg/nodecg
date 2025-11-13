import path from "node:path";

import { afterEach, expect, test } from "vitest";
import { getMockRes } from "vitest-mock-express";

import { sendFile } from ".";

const { res, next, mockClear } = getMockRes();

afterEach(() => {
	mockClear();
});

test("success", () => {
	sendFile(
		path.join(__dirname, "fixtures"),
		path.join(__dirname, "fixtures/foo/bar/hoge"),
		res,
		next,
	);
	expect(res.sendFile).toHaveBeenCalledWith(
		path.join(__dirname, "fixtures/foo/bar/hoge"),
		expect.any(Function),
	);
});

test("should return 404 when trying to traverse out of the directory", () => {
	sendFile(
		path.join(__dirname, "fixtures/foo/bar"),
		path.join(__dirname, "fixtures/foo/bar2"),
		res,
		next,
	);
	expect(res.sendStatus).toHaveBeenCalledWith(404);
});

test("should return 404 for non-existing file", () => {
	sendFile(
		path.join(__dirname, "fixtures/foo/bar"),
		path.join(__dirname, "fixtures/foo/aaaaa"),
		res,
		next,
	);
	expect(res.sendStatus).toHaveBeenCalledWith(404);
});
