import { loadNamespace } from "@nodecg/client";
import { beforeAll, describe, expect, onTestFinished, test, vi } from "vitest";

import { makeAuthHelpers } from "../../src/client/auth.ts";
import { suiteBase } from "../../src/client/suite-base.ts";
import { replicantSyncManifest } from "./manifest.ts";

const base = suiteBase("replicant-sync");
const { createUser, grantAsAdmin, login, logout, revokeAsAdmin } =
	makeAuthHelpers(base);

// Assign the roles the field-access tests rely on once, so those tests just log
// in as the subject. Grant/revoke behavior itself is covered in auth.test.ts.
beforeAll(async () => {
	const prodUserId = await createUser("prod");
	const viewUserId = await createUser("view");
	await grantAsAdmin(prodUserId, { namespace: "e2e", name: "producer" });
	await grantAsAdmin(viewUserId, { namespace: "e2e", name: "viewer" });
	return async () => {
		await revokeAsAdmin(prodUserId, { namespace: "e2e", name: "producer" });
		await revokeAsAdmin(viewUserId, { namespace: "e2e", name: "viewer" });
		await logout();
	};
});

describe("anonymous access", () => {
	beforeAll(async () => {
		await logout();
	});

	test("a read of a restricted field is denied (HTTP 403)", async () => {
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		await expect(ns.replicant.secret.get()).rejects.toThrow(
			/Permission denied/,
		);
	});

	test("a subscribe to a restricted field is rejected (WS forbidden)", async () => {
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		await expect(ns.replicant.secret.subscribe(() => {})).rejects.toThrow(
			/Permission denied/,
		);
	});
});

describe("client ⇄ server replicant sync (as producer)", () => {
	beforeAll(async () => {
		await login("prod");
	});

	test("reads the server-seeded value", async () => {
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		expect(await ns.replicant.count.get()).toBe(0);
		expect(await ns.replicant.label.get()).toBe("hello");
	});

	test("set round-trips through the server", async () => {
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		await ns.replicant.count.set(42);
		expect(await ns.replicant.count.get()).toBe(42);
	});

	test("a subscriber gets the old value", async () => {
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		await ns.replicant.count.set(5);
		const received: Array<[number, number | undefined]> = [];
		const cancel = await ns.replicant.count.subscribe((value, oldValue) => {
			received.push([value, oldValue]);
		});
		onTestFinished(() => cancel());
		await vi.waitFor(() => expect(received).toEqual([[5, undefined]]));
		await ns.replicant.count.set(7);
		await vi.waitFor(() =>
			expect(received).toEqual([
				[5, undefined],
				[7, 5],
			]),
		);
	});

	test("a subscriber receives its own update exactly once", async () => {
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		await ns.replicant.count.set(20);
		const received: number[] = [];
		const cancel = await ns.replicant.count.subscribe((value) => {
			received.push(value);
		});
		onTestFinished(() => cancel());
		await vi.waitFor(() => expect(received).toEqual([20]));

		await ns.replicant.count.update((count) => count + 1);
		await vi.waitFor(() => expect(received).toContain(21));
		await ns.replicant.count.update((count) => count + 1);
		await vi.waitFor(() => expect(received).toContain(22));
		expect(received).toEqual([20, 21, 22]);
	});

	test("concurrent writes to disjoint fields both land", async () => {
		const writer = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(writer.dispose);
		await writer.replicant.scoreboard.set({ home: 0, away: 0 });
		// Subscribing holds the field hot, so both updaters read the same base and
		// their patches genuinely race.
		const cancel = await writer.replicant.scoreboard.subscribe(() => {});
		onTestFinished(() => cancel());

		await Promise.all([
			writer.replicant.scoreboard.update((draft) => {
				draft.home = 1;
			}),
			writer.replicant.scoreboard.update((draft) => {
				draft.away = 2;
			}),
		]);

		const reader = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(reader.dispose);
		expect(await reader.replicant.scoreboard.get()).toEqual({
			home: 1,
			away: 2,
		});
	});

	test("concurrent same-field increments converge through retry", async () => {
		const writer = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(writer.dispose);
		await writer.replicant.count.set(0);
		// Subscribing holds the field hot, so all three updaters read the same
		// base and the losers genuinely conflict before re-running.
		const cancel = await writer.replicant.count.subscribe(() => {});
		onTestFinished(() => cancel());

		await Promise.all([
			writer.replicant.count.update((c) => c + 1),
			writer.replicant.count.update((c) => c + 1),
			writer.replicant.count.update((c) => c + 1),
		]);

		const reader = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(reader.dispose);
		expect(await reader.replicant.count.get()).toBe(3);
	});

	test("{ retry: false } surfaces a same-field conflict instead of resending", async () => {
		const writer = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(writer.dispose);
		await writer.replicant.scoreboard.set({ home: 0, away: 0 });
		const cancel = await writer.replicant.scoreboard.subscribe(() => {});
		onTestFinished(() => cancel());

		const [first, second] = await Promise.allSettled([
			writer.replicant.scoreboard.update(
				(draft) => {
					draft.home = 1;
				},
				{ retry: false },
			),
			writer.replicant.scoreboard.update(
				(draft) => {
					draft.home = 2;
				},
				{ retry: false },
			),
		]);

		const rejected = [first, second].filter(
			(outcome) => outcome.status === "rejected",
		);
		expect(rejected).toHaveLength(1);
		expect(String(rejected[0]?.reason)).toMatch(
			/conflicted with a concurrent update/,
		);

		const reader = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(reader.dispose);
		expect(await reader.replicant.scoreboard.get()).toEqual({
			home: first.status === "fulfilled" ? 1 : 2,
			away: 0,
		});
	});

	test("concurrent key adds both land", async () => {
		const writer = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(writer.dispose);
		await writer.replicant.tallies.set({});
		const cancel = await writer.replicant.tallies.subscribe(() => {});
		onTestFinished(() => cancel());

		await Promise.all([
			writer.replicant.tallies.update((draft) => {
				draft["first"] = 1;
			}),
			writer.replicant.tallies.update((draft) => {
				draft["second"] = 2;
			}),
		]);

		const reader = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(reader.dispose);
		expect(await reader.replicant.tallies.get()).toEqual({
			first: 1,
			second: 2,
		});
	});

	test("concurrent array appends both land", async () => {
		const writer = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(writer.dispose);
		await writer.replicant.roster.set([]);
		const cancel = await writer.replicant.roster.subscribe(() => {});
		onTestFinished(() => cancel());

		await Promise.all([
			writer.replicant.roster.update((draft) => {
				draft.push({ id: "alice", score: 1 });
			}),
			writer.replicant.roster.update((draft) => {
				draft.push({ id: "bob", score: 2 });
			}),
		]);

		const reader = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(reader.dispose);
		const roster = await reader.replicant.roster.get();
		expect([...roster].sort((a, b) => a.id.localeCompare(b.id))).toEqual([
			{ id: "alice", score: 1 },
			{ id: "bob", score: 2 },
		]);
	});

	test("subscribe receives an array reorder with an element edit", async () => {
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		const seed = [
			{ id: "alice", score: 1 },
			{ id: "bob", score: 2 },
			{ id: "carol", score: 3 },
		];
		await ns.replicant.roster.set(seed);
		const received: { id: string; score: number }[][] = [];
		const cancel = await ns.replicant.roster.subscribe((value) => {
			received.push([...value]);
		});
		onTestFinished(() => cancel());
		await vi.waitFor(() => expect(received.at(-1)).toEqual(seed));

		await ns.replicant.roster.update((roster) => {
			for (const entry of roster) {
				if (entry.id === "carol") {
					entry.score = 99;
				}
			}
			roster.reverse();
		});

		await vi.waitFor(() =>
			expect(received.at(-1)).toEqual([
				{ id: "carol", score: 99 },
				{ id: "bob", score: 2 },
				{ id: "alice", score: 1 },
			]),
		);
	});

	test("reads a server-computed value over HTTP", async () => {
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		await ns.replicant.count.set(10);
		expect(await ns.computed.doubledCount.get()).toBe(20);
	});

	test("subscribe to a computed value receives recomputed updates", async () => {
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		await ns.replicant.count.set(3);
		const received: number[] = [];
		const cancel = await ns.computed.doubledCount.subscribe((value) => {
			received.push(value);
		});
		onTestFinished(() => cancel());
		await vi.waitFor(() => expect(received.at(-1)).toBe(6));
		await ns.replicant.count.set(4);
		await vi.waitFor(() => expect(received.at(-1)).toBe(8));
	});

	test("a branching computed dedupes source changes it doesn't depend on", async () => {
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		await ns.replicant.count.set(0);
		await ns.replicant.label.set("first");
		const received: string[] = [];
		const cancel = await ns.computed.summary.subscribe((value) => {
			received.push(value);
		});
		onTestFinished(() => cancel());
		await vi.waitFor(() => expect(received).toEqual(["idle"]));
		await ns.replicant.label.set("second");
		await ns.replicant.count.set(3);
		await vi.waitFor(() => expect(received).toEqual(["idle", "second x3"]));
	});
});

describe("namespace frontend serving", () => {
	test("serves the namespace's index", async () => {
		const response = await fetch(`${base}/frontend/namespaces/e2e/`);
		expect(response.ok).toBe(true);
		expect(await response.text()).toContain("hello from the frontend");
	});

	test("serves a file under the namespace", async () => {
		const response = await fetch(`${base}/frontend/namespaces/e2e/app.js`);
		expect(response.ok).toBe(true);
		expect(await response.text()).toContain("frontend module loaded");
	});

	test("404s for an unknown namespace", async () => {
		const response = await fetch(
			`${base}/frontend/namespaces/unknown/index.html`,
		);
		expect(response.status).toBe(404);
	});

	test("404s for a missing file in a known namespace", async () => {
		const response = await fetch(`${base}/frontend/namespaces/e2e/missing.js`);
		expect(response.status).toBe(404);
	});
});

describe("spa frontend serving", () => {
	test("serves the index", async () => {
		const response = await fetch(`${base}/frontend/namespaces/e2e-library/`);
		expect(response.ok).toBe(true);
		expect(await response.text()).toContain("spa shell");
	});

	test("falls back to the index for a client-side route", async () => {
		const response = await fetch(
			`${base}/frontend/namespaces/e2e-library/some/route`,
			{ headers: { accept: "text/html" } },
		);
		expect(response.ok).toBe(true);
		expect(await response.text()).toContain("spa shell");
	});

	test("404s for a missing file despite the fallback", async () => {
		const response = await fetch(
			`${base}/frontend/namespaces/e2e-library/missing.js`,
		);
		expect(response.status).toBe(404);
	});
});

describe("role-gated field access (HTTP)", () => {
	test("anonymous is denied the role-gated and the member-gated field", async () => {
		await logout();
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		await expect(ns.replicant.producerOnly.get()).rejects.toThrow(
			/Permission denied/,
		);
		await expect(ns.replicant.membersOnly.get()).rejects.toThrow(
			/Permission denied/,
		);
	});

	test("an explicit producer reads the producer-only and member fields", async () => {
		await login("prod");
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		expect(await ns.replicant.producerOnly.get()).toBe("producers-only");
		expect(await ns.replicant.membersOnly.get()).toBe("members-only");
	});

	test("a viewer reads the member field via the umbrella but not the producer-only field", async () => {
		await login("view");
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		expect(await ns.replicant.membersOnly.get()).toBe("members-only");
		await expect(ns.replicant.producerOnly.get()).rejects.toThrow(
			/Permission denied/,
		);
	});

	test("a producer of the library writes its score", async () => {
		const libraryUserId = await createUser("library");
		await grantAsAdmin(libraryUserId, {
			namespace: "e2e-library",
			name: "producer",
		});
		onTestFinished(async () => {
			await revokeAsAdmin(libraryUserId, {
				namespace: "e2e-library",
				name: "producer",
			});
		});
		await login("library");
		const root = await loadNamespace(replicantSyncManifest, { baseUrl: base });
		onTestFinished(root.dispose);
		await root.children.library.replicant.score.set(7);
		expect(await root.children.library.replicant.score.get()).toBe(7);
	});

	test("a role granted in one namespace does not reach another declaring the same role", async () => {
		const singleUserId = await createUser("single");
		await grantAsAdmin(singleUserId, { namespace: "e2e", name: "producer" });
		onTestFinished(async () => {
			await revokeAsAdmin(singleUserId, {
				namespace: "e2e",
				name: "producer",
			});
		});
		await login("single");
		const root = await loadNamespace(replicantSyncManifest, { baseUrl: base });
		onTestFinished(root.dispose);
		expect(await root.children.fixture.replicant.producerOnly.get()).toBe(
			"producers-only",
		);
		await expect(root.children.library.replicant.score.set(1)).rejects.toThrow(
			/Permission denied/,
		);
	});
});

describe("WS handshake honors the session cookie", () => {
	test("a logged-in producer subscribes to a producer-only field", async () => {
		await login("prod");
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		const received: string[] = [];
		const cancel = await ns.replicant.producerOnly.subscribe((value) => {
			received.push(value);
		});
		onTestFinished(() => cancel());
		await vi.waitFor(() => expect(received).toEqual(["producers-only"]));
	});
});

describe("messaging (topic + rpc)", () => {
	beforeAll(async () => {
		await logout();
	});

	test("a topic publish fans out to a separate subscriber", async () => {
		const subscriber = await loadNamespace(
			replicantSyncManifest.children.fixture,
			{ baseUrl: base },
		);
		onTestFinished(subscriber.dispose);
		const publisher = await loadNamespace(
			replicantSyncManifest.children.fixture,
			{ baseUrl: base },
		);
		onTestFinished(publisher.dispose);
		const received: string[] = [];
		const cancel = await subscriber.topic.chat.subscribe((value) => {
			received.push(value);
		});
		onTestFinished(() => cancel());
		await vi.waitFor(
			async () => {
				await publisher.topic.chat.publish("hello");
				expect(received).toContain("hello");
			},
			{ timeout: 5000, interval: 100 },
		);
	});

	test("a second subscriber on the same client joins live without replaying the last event", async () => {
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		const publisher = await loadNamespace(
			replicantSyncManifest.children.fixture,
			{ baseUrl: base },
		);
		onTestFinished(publisher.dispose);
		const first: string[] = [];
		const cancelFirst = await ns.topic.chat.subscribe((value) => {
			first.push(value);
		});
		onTestFinished(() => cancelFirst());
		await vi.waitFor(
			async () => {
				await publisher.topic.chat.publish("seed");
				expect(first).toContain("seed");
			},
			{ timeout: 5000, interval: 100 },
		);
		await publisher.topic.chat.publish("sync");
		await vi.waitFor(() => expect(first).toContain("sync"));

		const second: string[] = [];
		const cancelSecond = await ns.topic.chat.subscribe((value) => {
			second.push(value);
		});
		onTestFinished(() => cancelSecond());
		await vi.waitFor(
			async () => {
				await publisher.topic.chat.publish("live");
				expect(second).toContain("live");
			},
			{ timeout: 5000, interval: 100 },
		);

		expect(second).not.toContain("seed");
		expect(second).not.toContain("sync");
		expect(first).toContain("live");
	});

	test("an rpc call runs the server handler and returns its response", async () => {
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		expect(await ns.rpc.echo.call("ping")).toBe("PING");
	});

	test("an rpc handler mutates a replicant that a subscriber observes", async () => {
		const ns = await loadNamespace(replicantSyncManifest.children.fixture, {
			baseUrl: base,
		});
		onTestFinished(ns.dispose);
		const received: number[] = [];
		const cancel = await ns.replicant.count.subscribe((value) => {
			received.push(value);
		});
		onTestFinished(() => cancel());
		await vi.waitFor(() => expect(received.length).toBeGreaterThan(0));
		const returned = await ns.rpc.bump.call(5);
		await vi.waitFor(() => expect(received).toContain(returned));
	});
});
