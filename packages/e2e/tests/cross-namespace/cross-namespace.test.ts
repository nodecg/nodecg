import { loadNamespace } from "@nodecg-next/client";
import { describe, expect, onTestFinished, test, vi } from "vitest";

import { suiteBase } from "../../src/client/suite-base.ts";
import { crossManifest } from "../../src/shared/manifests.ts";

const base = suiteBase("cross-namespace");

describe("cross-namespace rpc via ctx.children", () => {
	test("an rpc writes its child's replicant", async () => {
		const cross = await loadNamespace(crossManifest, { baseUrl: base });
		onTestFinished(cross.dispose);
		const { extended } = cross.children;
		const before = await extended.replicant.score.get();

		const returned = await cross.rpc.addScore.call(5);

		expect(returned).toBe(before + 5);
		expect(await extended.replicant.score.get()).toBe(before + 5);
	});
});

describe("cross-namespace computed via ctx.children", () => {
	test("recomputes when the source in its child changes", async () => {
		const cross = await loadNamespace(crossManifest, { baseUrl: base });
		onTestFinished(cross.dispose);
		const { extended } = cross.children;
		const score = await extended.replicant.score.get();

		expect(await cross.computed.scaledScore.get()).toBe(score * 2);

		const received: number[] = [];
		const cancel = await cross.computed.scaledScore.subscribe((value) => {
			received.push(value);
		});
		onTestFinished(() => cancel());
		await vi.waitFor(() => expect(received.at(-1)).toBe(score * 2));

		await cross.rpc.addScore.call(3);

		await vi.waitFor(() => expect(received.at(-1)).toBe((score + 3) * 2));
	});
});
