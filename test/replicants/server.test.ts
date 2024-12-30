import timersPromises from "node:timers/promises";

import { expect } from "vitest";

import { Replicant } from "../../src/server/database/default/connection";
import type { AbstractReplicant } from "../../src/shared/replicants.shared";
import { setupTest } from "../helpers/setup";
import { waitOneTick } from "../helpers/utilities";

const test = await setupTest();

test("should return a reference to any already-declared replicant", ({
	apis,
}) => {
	const rep1 = apis.extension.Replicant("dupRef");
	const rep2 = apis.extension.Replicant("dupRef");
	expect(rep1).toBe(rep2);
});

test("should only apply defaultValue when first declared", async ({
	dashboard,
	apis,
}) => {
	await dashboard.evaluate(
		async () =>
			new Promise((done) => {
				const rep = window.dashboardApi.Replicant("extensionTest", {
					defaultValue: "foo",
					persistent: false,
				});
				rep.on("declared", done);
			}),
	);

	const rep = apis.extension.Replicant("extensionTest", {
		defaultValue: "bar",
	});

	expect(rep.value).toBe("foo");
});

test("should be readable without subscription, via readReplicant", ({
	apis,
}) => {
	expect(apis.extension.readReplicant("extensionTest")).toBe("foo");
});

test("should throw an error when no name is provided", ({ apis }) => {
	expect(() => {
		// @ts-expect-error
		apis.extension.Replicant();
	}).toThrowErrorMatchingInlineSnapshot(
		`[Error: Must supply a name when instantiating a Replicant]`,
	);
});

test("should not explode when schema is invalid", ({ apis }) => {
	expect(() => {
		apis.extension.Replicant("badSchema");
	}).not.toThrow();
});

test('should be assignable via the ".value" property', ({ apis }) => {
	const rep = apis.extension.Replicant("extensionAssignmentTest", {
		persistent: false,
	});
	rep.value = "assignmentOK";
	expect(rep.value).toBe("assignmentOK");
});

test("should react to changes in nested properties of objects", async ({
	apis,
}) => {
	const rep = apis.extension.Replicant("extensionObjTest", {
		persistent: false,
		defaultValue: { a: { b: { c: "c" } } },
	});

	const promise = new Promise<void>((resolve, reject) => {
		rep.on("change", (newVal, oldVal, operations) => {
			if (!newVal) {
				reject("no value");
				return;
			}

			if (newVal.a.b.c !== "nestedChangeOK") {
				return;
			}

			expect(oldVal).toEqual({ a: { b: { c: "c" } } });
			expect(newVal).toEqual({ a: { b: { c: "nestedChangeOK" } } });
			expect(operations).toEqual([
				{
					args: {
						newValue: "nestedChangeOK",
						prop: "c",
					},
					method: "update",
					path: "/a/b",
				},
			]);
			resolve();
		});
	});

	rep.value.a.b.c = "nestedChangeOK";

	await promise;
});

test("memoization", ({ apis }) => {
	expect(apis.extension.Replicant("memoizationTest")).toBe(
		apis.extension.Replicant("memoizationTest"),
	);
});

test("should only apply array splices from the client once", async ({
	apis,
	dashboard,
}) => {
	const serverRep = apis.extension.Replicant("clientDoubleApplyTest", {
		persistent: false,
		defaultValue: [],
	});

	await dashboard.evaluate(
		async () =>
			new Promise<void>((resolve) => {
				(window as any).clientDoubleApplyTest = window.dashboardApi.Replicant(
					"clientDoubleApplyTest",
				);
				(window as any).clientDoubleApplyTest.once("declared", () => {
					(window as any).clientDoubleApplyTest.on("change", () => {
						resolve();
					});
				});
			}),
	);

	let changeNum = 0;
	const promise = new Promise<void>((resolve) => {
		serverRep.on("change", (newVal) => {
			if (changeNum === 0) {
				expect(newVal).toEqual([]);
			} else {
				expect(newVal).toEqual(["test"]);
				resolve();
			}

			changeNum++;
		});
	});

	expect(serverRep.value).toEqual([]);

	await dashboard.evaluate(() =>
		(window as any).clientDoubleApplyTest.value.push("test"),
	);

	await promise;
});

test("should remove .once listeners when quickfired", ({ apis }) => {
	const rep = apis.extension.Replicant("serverRemoveOnceListener", {
		persistent: false,
	});

	let called = false;
	const callback = (): void => {
		called = true;
	};

	rep.once("change", callback);
	expect(called).toBe(true);
	expect(rep.listeners("change")).not.toContain(callback);
});

test('should not override/quickfire .once for events other than "change"', ({
	apis,
}) => {
	const rep = apis.extension.Replicant("serverNotOverrideOtherOnceListeners", {
		persistent: false,
	});

	rep.once("declared", () => {
		throw new Error("This should not have been called");
	});
});

test('arrays - should support the "delete" operator', async ({ apis }) => {
	let deleted = false;

	const rep = apis.extension.Replicant<any[]>("serverArrayDelete", {
		persistent: false,
		defaultValue: ["foo", "bar"],
	});

	const promise = new Promise<void>((resolve) => {
		rep.on("change", (newVal, oldVal, operations) => {
			if (!deleted) {
				return;
			}

			// eslint-disable-next-line no-sparse-arrays
			expect(newVal).toEqual([, "bar"]);
			expect(oldVal).toEqual(["foo", "bar"]);
			expect(operations).toEqual([
				{
					args: { prop: "0" as any },
					path: "/",
					method: "delete" as const,
				},
			]);
			resolve();
		});
	});

	process.nextTick(() => {
		// eslint-disable-next-line @typescript-eslint/no-array-delete
		delete rep.value[0];
		deleted = true;
	});

	return promise;
});

test("arrays - should react to changes", async ({ apis }) => {
	let pushed = false;

	const rep = apis.extension.Replicant("extensionArrTest", {
		persistent: false,
		defaultValue: ["starting"],
	});

	const promise = new Promise<void>((resolve) => {
		rep.on("change", (newVal, oldVal, operations) => {
			if (!pushed) {
				return;
			}

			expect(oldVal).toEqual(["starting"]);
			expect(newVal).toEqual(["starting", "arrPushOK"]);
			expect(operations).toEqual([
				{
					args: {
						mutatorArgs: ["arrPushOK"],
					},
					method: "push",
					path: "/",
				},
			]);
			resolve();
		});
	});

	process.nextTick(() => {
		rep.value.push("arrPushOK");
		pushed = true;
	});

	return promise;
});

test("objects - throw an error when an object is owned by multiple Replicants", ({
	apis,
}) => {
	type ValType = Record<string, Record<string, string>>;
	const rep1 = apis.extension.Replicant<ValType>("multiOwner1");
	const rep2 = apis.extension.Replicant<ValType>("multiOwner2");
	const bar = { bar: "bar" };
	rep1.value = {};
	rep2.value = {};
	rep1.value.foo = bar;

	expect(() => {
		if (rep2.value) {
			rep2.value.foo = bar;
		}
	}).toThrowErrorMatchingInlineSnapshot(`
		[Error: This object belongs to another Replicant, test-bundle::multiOwner1.
		A given object cannot belong to multiple Replicants. Object value:
		{
		  "bar": "bar"
		}]
	`);
});

test("dates - should not throw an error", ({ apis }) => {
	expect(() => {
		apis.extension.Replicant("extensionDateTest", {
			defaultValue: new Date(),
		});
	}).not.toThrow();
});

test("persistent - should load persisted values when they exist", async ({
	apis,
	server,
}) => {
	const rep = apis.extension.Replicant("extensionPersistence", {
		persistenceInterval: 0,
	});
	expect(rep.value).toEqual("it work good!");
	await server.saveAllReplicantsNow();
});

test("persistent - should persist assignment to database", async ({
	apis,
	server,
	database,
}) => {
	const rep = apis.extension.Replicant("extensionPersistence", {
		persistenceInterval: 0,
	});
	rep.value = { nested: "hey we assigned!" };

	await server.saveAllReplicantsNow();

	const fromDb = await database.manager.findOneByOrFail(Replicant, {
		namespace: "test-bundle",
		name: "extensionPersistence",
	});

	expect(fromDb.value).toEqual('{"nested":"hey we assigned!"}');
});

test("persistent - should persist changes to database", async ({
	apis,
	server,
	database,
}) => {
	const rep = apis.extension.Replicant<Record<string, string>>(
		"extensionPersistence",
		{
			persistenceInterval: 0,
		},
	) as unknown as AbstractReplicant<
		"server",
		Record<string, string>,
		Record<string, unknown>,
		true
	>;
	rep.value.nested = "hey we changed!";

	await server.saveAllReplicantsNow();

	const fromDb = await database.manager.findOneByOrFail(Replicant, {
		namespace: "test-bundle",
		name: "extensionPersistence",
	});

	expect(fromDb.value).toEqual('{"nested":"hey we changed!"}');
});

test("persistent - should persist top-level string", async ({
	apis,
	server,
	database,
}) => {
	const rep = apis.extension.Replicant("extensionPersistence", {
		persistenceInterval: 0,
	});
	rep.value = "lorem";

	await server.saveAllReplicantsNow();

	const fromDb = await database.manager.findOneByOrFail(Replicant, {
		namespace: "test-bundle",
		name: "extensionPersistence",
	});

	expect(fromDb.value).toEqual('"lorem"');
});

test("persistent - should persist top-level undefined", async ({
	apis,
	database,
	server,
}) => {
	const rep = apis.extension.Replicant("extensionPersistence", {
		persistenceInterval: 0,
	});
	rep.value = undefined;

	await server.saveAllReplicantsNow();

	const fromDb = await database.manager.findOneByOrFail(Replicant, {
		namespace: "test-bundle",
		name: "extensionPersistence",
	});

	expect(fromDb.value).toEqual("");
});

test("persistent - should persist falsey values to disk", async ({
	apis,
	server,
	database,
}) => {
	const rep = apis.extension.Replicant("extensionFalseyWrite", {
		persistenceInterval: 0,
	});
	rep.value = 0;

	await server.saveAllReplicantsNow();

	const fromDb = await database.manager.findOneByOrFail(Replicant, {
		namespace: "test-bundle",
		name: "extensionFalseyWrite",
	});

	expect(fromDb.value).toEqual("0");
});

test("persistent - should read falsey values from disk", ({ apis }) => {
	const rep = apis.extension.Replicant("extensionFalseyRead", {
		persistenceInterval: 0,
	});
	expect(rep.value).toBe(0);
});

test("transient - should not write their value to disk", async ({
	apis,
	server,
	database,
}) => {
	const rep = apis.extension.Replicant("extensionTransience", {
		persistent: false,
	});
	rep.value = "o no";

	await server.saveAllReplicantsNow();

	const fromDb = await database.manager.findOneBy(Replicant, {
		namespace: "test-bundle",
		name: "extensionTransience",
	});

	expect(fromDb).toBe(null);
});

test("should return true when deleting a non-existing property", ({ apis }) => {
	const rep = apis.extension.Replicant("serverDeleteNonExistent", {
		defaultValue: {},
	});

	expect(delete (rep.value as any).nonExistent).toBe(true);
});

test("test that one else path that's hard to hit", ({ apis }) => {
	const rep = apis.extension.Replicant<boolean[]>(
		"arrayWithoutSchemaSetHandler",
		{ defaultValue: [] },
	);
	rep.value[0] = true;
});

test("should leave the default value intact", ({ apis }) => {
	const defaultValue = { lorem: "ipsum" };
	const rep = apis.extension.Replicant("defaultValueIntact", {
		defaultValue,
	});

	expect(rep.opts.defaultValue).toEqual(defaultValue);
	expect(rep.value).not.toBe(defaultValue);
});

test("provides accurate new and old values for assignment operations", async ({
	apis,
}) => {
	const rep = apis.extension.Replicant<number | undefined>(
		"serverNewAndOldValues",
	);
	let changeNumber = 0;

	const promise = new Promise<void>((resolve, reject) => {
		rep.on("change", (n, o) => {
			switch (changeNumber++) {
				case 0:
					expect(n).toBe(undefined);
					expect(o).toBe(undefined);
					break;
				case 1:
					expect(n).toBe(1);
					expect(o).toBe(undefined);
					break;
				case 2:
					expect(n).toBe(2);
					expect(o).toBe(1);
					break;
				case 3:
					expect(n).toBe(3);
					expect(o).toBe(2);
					resolve();
					return;
				default:
					reject(`Unexpected change number "${changeNumber}"`);
					return;
			}

			setTimeout(() => {
				if (n === undefined) {
					rep.value = 1;
				} else if (typeof rep.value === "number") {
					rep.value++;
				} else {
					throw new Error("Not sure how we got here");
				}
			}, 0);
		});
	});

	await promise;
});

test("should not emit more than one change event on startup when a defaultValue is supplied", async ({
	apis,
}) => {
	const rep = apis.extension.Replicant("multipleStartupChangeEvents", {
		defaultValue: 0,
	});

	let numChanges = 0;
	rep.on("change", () => {
		numChanges++;
		if (numChanges > 1) {
			throw new Error("Too many change events emitted");
		}
	});

	await waitOneTick();

	expect(numChanges).toBe(1);
});

test("should force persistence after maximumTimeAReplicantCanGoWithoutSaving", async ({
	apis,
	database,
}) => {
	const rep = apis.extension.Replicant(
		"maximumTimeAReplicantCanGoWithoutSaving",
		{
			defaultValue: 0,
			persistenceInterval: 100,
		},
	);

	// Update faster than the persistenceInterval, to prevent the throttle/debounce from ever resolving
	const interval = setInterval(() => {
		rep.value++;
	}, 50);

	await timersPromises.setTimeout(500);

	// If the Replicant hasn't been able to persist a single time yet,
	// this call will fail saying it couldn't find it.
	const fromDb = await database.manager.findOneByOrFail(Replicant, {
		namespace: "test-bundle",
		name: "maximumTimeAReplicantCanGoWithoutSaving",
	});

	expect(parseInt(fromDb.value, 10) > 0).toBe(true);
	clearInterval(interval);
});
