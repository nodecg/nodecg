import { loadNamespace } from "@nodecg-next/client";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands } from "vitest/browser";

import { suiteBase } from "../../src/client/suite-base.ts";
import { persistenceManifest } from "./manifest.ts";

const base = suiteBase("replicant-persistence");

describe("replicant persistence", () => {
	test("restores only persisted replicants after a restart", async () => {
		const before = await loadNamespace(persistenceManifest, { baseUrl: base });
		await before.replicant.live.set(7);
		await before.replicant.score.set(7);
		before.dispose();

		await commands.restartServer("replicant-persistence");

		const after = await loadNamespace(persistenceManifest, { baseUrl: base });
		onTestFinished(after.dispose);
		expect(await after.replicant.live.get()).toBe(0);
		expect(await after.replicant.score.get()).toBe(7);
	});
});
