import { loadNamespace } from "@nodecg-next/client";
import { describe, expect, onTestFinished, test, vi } from "vitest";

import { suiteBase } from "../../src/client/suite-base.ts";
import { fixtureManifest } from "../../src/shared/manifests.ts";

const base = suiteBase("server-handles");

describe("entry-script namespace handles", () => {
	test("a source change is mirrored by the entry script's handle subscription", async () => {
		const ns = await loadNamespace(fixtureManifest, { baseUrl: base });
		onTestFinished(ns.dispose);

		await ns.replicant.mirrorSource.set(21);

		await vi.waitFor(async () => {
			expect(await ns.replicant.mirror.get()).toBe(21);
		});
	});
});
