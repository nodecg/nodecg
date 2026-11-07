import { derive, loadNamespace } from "@nodecg/client";
import { describe, expect, onTestFinished, test, vi } from "vitest";

import { suiteBase } from "../../src/client/suite-base.ts";
import { computedChainManifest } from "./manifest.ts";

const base = suiteBase("computed-chain");

describe("chained computed over the wire", () => {
	test("reads through the chain", async () => {
		const root = await loadNamespace(computedChainManifest, { baseUrl: base });
		onTestFinished(root.dispose);
		const chain = root.children.chain;
		await chain.replicant.points.set(12);
		await chain.replicant.target.set(10);

		expect(await chain.computed.lead.get()).toBe(2);
		expect(await chain.computed.status.get()).toBe("ahead");
	});

	test("a replicant write streams through both computed levels and dedupes", async () => {
		const root = await loadNamespace(computedChainManifest, { baseUrl: base });
		onTestFinished(root.dispose);
		const chain = root.children.chain;
		await chain.replicant.points.set(0);
		await chain.replicant.target.set(0);

		const statuses: string[] = [];
		const cancel = await chain.computed.status.subscribe((value) => {
			statuses.push(value);
		});
		onTestFinished(() => cancel());

		await vi.waitFor(() => expect(statuses).toEqual(["level"]));

		await chain.replicant.points.set(2);
		await vi.waitFor(() => expect(statuses).toEqual(["level", "ahead"]));

		await chain.replicant.points.set(3);
		await chain.replicant.points.set(-2);
		await vi.waitFor(() =>
			expect(statuses).toEqual(["level", "ahead", "behind"]),
		);
	});

	test("subscribing to a currently-failing computed rejects instead of hanging", async () => {
		const root = await loadNamespace(computedChainManifest, { baseUrl: base });
		onTestFinished(root.dispose);
		const chain = root.children.chain;
		await chain.replicant.denominator.set(0); // makes reciprocal throw

		await expect(chain.computed.reciprocal.subscribe(() => {})).rejects.toThrow(
			/unavailable/i,
		);

		// a fresh subscribe heals once the source is fixed
		await chain.replicant.denominator.set(2);
		const values: number[] = [];
		const cancel = await chain.computed.reciprocal.subscribe((value) => {
			values.push(value);
		});
		onTestFinished(() => cancel());
		await vi.waitFor(() => expect(values).toEqual([0.5]));
	});

	test("the intermediate computed streams its own values", async () => {
		const root = await loadNamespace(computedChainManifest, { baseUrl: base });
		onTestFinished(root.dispose);
		const chain = root.children.chain;
		await chain.replicant.points.set(4);
		await chain.replicant.target.set(1);

		const leads: number[] = [];
		const cancel = await chain.computed.lead.subscribe((value) => {
			leads.push(value);
		});
		onTestFinished(() => cancel());

		await vi.waitFor(() => expect(leads).toEqual([3]));
		await chain.replicant.target.set(2);
		await vi.waitFor(() => expect(leads).toEqual([3, 2]));
	});
});

describe("client derive over the wire", () => {
	test("derives locally off server-pushed replicants", async () => {
		const root = await loadNamespace(computedChainManifest, { baseUrl: base });
		onTestFinished(root.dispose);
		const chain = root.children.chain;
		await chain.replicant.points.set(1);
		await chain.replicant.target.set(1);

		const verdict = derive((get) => {
			const points = get(chain.replicant.points);
			const target = get(chain.replicant.target);
			return points >= target ? "made it" : "keep going";
		});

		const seen: string[] = [];
		const unsubscribe = verdict.subscribe((value) => {
			seen.push(value);
		});
		onTestFinished(() => unsubscribe());

		await vi.waitFor(() => expect(seen.at(-1)).toBe("made it"));

		await chain.replicant.target.set(5);
		await vi.waitFor(() => expect(seen.at(-1)).toBe("keep going"));
	});

	test("a derive can read a server computed too", async () => {
		const root = await loadNamespace(computedChainManifest, { baseUrl: base });
		onTestFinished(root.dispose);
		const chain = root.children.chain;
		await chain.replicant.points.set(7);
		await chain.replicant.target.set(3);

		const caption = derive((get) => `lead: ${get(chain.computed.lead)}`);

		expect(await caption.get()).toBe("lead: 4");
	});

	test("dedupes an object result through the equals option", async () => {
		const root = await loadNamespace(computedChainManifest, { baseUrl: base });
		onTestFinished(root.dispose);
		const chain = root.children.chain;
		await chain.replicant.points.set(5);
		await chain.replicant.target.set(0);

		const standing = derive(
			(get) => ({
				ahead: get(chain.replicant.points) >= get(chain.replicant.target),
			}),
			{ equals: (a, b) => a.ahead === b.ahead },
		);

		const seen: boolean[] = [];
		const unsubscribe = standing.subscribe((value) => {
			seen.push(value.ahead);
		});
		onTestFinished(() => unsubscribe());
		await vi.waitFor(() => expect(seen).toEqual([true]));

		await chain.replicant.points.set(9);
		await chain.replicant.target.set(2);
		await chain.replicant.points.set(-4);
		await vi.waitFor(() => expect(seen).toEqual([true, false]));
	});

	test("derives across two namespaces off a computed and a replicant", async () => {
		const root = await loadNamespace(computedChainManifest, { baseUrl: base });
		onTestFinished(root.dispose);
		const { chain, cross } = root.children;
		await chain.replicant.points.set(6);
		await chain.replicant.target.set(2);

		const weighted = derive(
			(get) => get(chain.computed.lead) * get(cross.replicant.factor),
		);

		expect(await weighted.get()).toBe(8);

		const seen: number[] = [];
		const unsubscribe = weighted.subscribe((value) => {
			seen.push(value);
		});
		onTestFinished(() => unsubscribe());
		await vi.waitFor(() => expect(seen.at(-1)).toBe(8));

		await chain.replicant.points.set(10);
		await vi.waitFor(() => expect(seen.at(-1)).toBe(16));
	});
});
