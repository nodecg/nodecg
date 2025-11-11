import type { Command } from "commander";
import { beforeEach, expect, test, vi } from "vitest";

import { createMockProgram, type MockCommand } from "../../test/mocks/program.ts";
import { startCommand } from "./start.ts";

let program: MockCommand;

beforeEach(() => {
	program = createMockProgram();
	startCommand(program as unknown as Command);
});

test("should start NodeCG", async () => {
	const [port] = await Promise.all([
		vi.waitUntil(() => process.env["NODECG_TEST_PORT"], { timeout: 5000 }),
		program.runWith("start"),
	]);
	expect(port).toBeTypeOf("string");
	expect(port).toMatch(/^\d+$/);
});
