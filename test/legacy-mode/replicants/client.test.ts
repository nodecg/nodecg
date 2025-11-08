import { Replicant } from "@nodecg/database-adapter-sqlite-legacy";
import { expect } from "vitest";

import type { NodeCG } from "../../../src/types/nodecg";
import { setupTest } from "../../helpers/setup";

const test = await setupTest();

test("should return a reference to any already-declared replicant", async ({
	dashboard,
}) => {
	const ret = await dashboard.evaluate(() => {
		const rep1 = window.dashboardApi.Replicant("clientDupRef");
		const rep2 = window.dashboardApi.Replicant("clientDupRef");
		return rep1 === rep2;
	});
	expect(ret).toBe(true);
});

test("should only apply defaultValue when first declared", async ({
	apis,
	dashboard,
}) => {
	apis.extension.Replicant("clientTest", {
		defaultValue: "foo",
		persistent: false,
	});

	const ret = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep = window.dashboardApi.Replicant("clientTest", {
					defaultValue: "bar",
				});
				rep.on("declared", () => {
					resolve(rep.value);
				});
			}),
	);

	expect(ret).toBe("foo");
});

test("should be readable without subscription, via readReplicant", async ({
	apis,
	dashboard,
}) => {
	apis.extension.Replicant("clientReadReplicentTest", {
		defaultValue: "foo",
		persistent: false,
	});

	const ret = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				window.dashboardApi.readReplicant("clientReadReplicentTest", resolve);
			}),
	);

	expect(ret).toBe("foo");
});

test("should throw an error when no name is provided", async ({
	dashboard,
}) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				try {
					// @ts-expect-error
					window.dashboardApi.Replicant();
				} catch (e: any) {
					resolve(e.message);
				}
			}),
	);

	expect(ret).toBe("Must supply a name when instantiating a Replicant");
});

test('should be assignable via the ".value" property', async ({
	dashboard,
}) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise<{ value: unknown; revision: number }>((resolve) => {
				const rep = window.dashboardApi.Replicant("clientAssignmentTest", {
					persistent: false,
				});
				rep.on("change", (newVal) => {
					if (newVal === "assignmentOK") {
						resolve({
							value: rep.value,
							revision: rep.revision,
						});
					}
				});
				rep.value = "assignmentOK";
			}),
	);

	expect(ret.value).toBe("assignmentOK");
	expect(ret.revision).toBe(1);
});

test('should emit a "change" event after successful declaration when the value is undefined', async ({
	dashboard,
}) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise<{ valueWasUndefined: boolean; revision: number }>(
				(resolve) => {
					const rep = window.dashboardApi.Replicant(
						"clientUndefinedChangeTest",
						{ persistent: false },
					);
					rep.on("change", () => {
						resolve({
							// Little hack to workaround the fact that `undefined` gets serialized to `null`.
							valueWasUndefined: rep.value === undefined,
							revision: rep.revision,
						});
					});
				},
			),
	);

	expect(ret.valueWasUndefined).toBe(true);
	expect(ret.revision).toBe(0);
});

test("should log a warning when attempting to access .value before the Replicant has finished declaring", async ({
	dashboard,
}) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise<unknown[]>((resolve) => {
				const rep = window.dashboardApi.Replicant("clientEarlyValueAccess", {
					persistent: false,
				});

				// TODO: Replace this with sinon.
				const originalWarn = rep.log.warn;
				rep.log.warn = (...args) => {
					rep.log.warn = originalWarn;
					resolve(args);
				};

				const val = rep.value;
				if (typeof val === "string") {
					val.trim();
				}
			}),
	);

	expect(ret[0]).toBe(
		"Attempted to get value before Replicant had finished declaring. This will always return undefined.",
	);
});

test("should remove .once listeners when quickfired", async ({ dashboard }) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise<number>((resolve) => {
				const rep = window.dashboardApi.Replicant("clientRemoveOnceListener", {
					persistent: false,
				});

				rep.once("declared", () => {
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					rep.once("change", () => {});
					resolve(rep.listenerCount("change"));
				});
			}),
	);

	expect(ret).toBe(0);
});

test("when an array - should react to changes", async ({ dashboard }) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise<{
				newVal: unknown[];
				oldVal: unknown[];
				operations: NodeCG.Replicant.Operation<unknown[]>[];
			}>((resolve) => {
				const rep = window.dashboardApi.Replicant("clientArrTest", {
					persistent: false,
					defaultValue: ["starting"],
				});

				rep.on("declared", () => {
					rep.on("change", (newVal, oldVal, operations) => {
						if (
							newVal &&
							oldVal &&
							operations &&
							operations[0]?.method === "push"
						) {
							const res = {
								newVal: JSON.parse(JSON.stringify(newVal)),
								oldVal,
								operations,
							};
							resolve(res);
						}
					});

					rep.value!.push("arrPushOK");
				});
			}),
	);

	expect(ret.newVal).toEqual(["starting", "arrPushOK"]);
	expect(ret.oldVal).toEqual(["starting"]);
	expect(ret.operations).toEqual([
		{
			args: {
				mutatorArgs: ["arrPushOK"],
			},
			path: "/",
			method: "push" as const,
		},
	]);
});

test('when an array - should support the "delete" operator', async ({
	dashboard,
}) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise<{
				newVal: unknown[];
				oldVal: unknown[];
				operations: NodeCG.Replicant.Operation<unknown[]>[];
			}>((resolve, reject) => {
				const rep = window.dashboardApi.Replicant<unknown[]>(
					"clientArrayDelete",
					{
						defaultValue: ["foo", "bar"],
						persistent: false,
					},
				);

				let deleted = false;
				rep.on("change", (newVal, oldVal, operations) => {
					if (!newVal) {
						reject(new Error("no value"));
						return;
					}

					if (newVal[0] === "foo" && !deleted) {
						 
						delete rep.value![0];
						deleted = true;
					} else if (newVal[0] === undefined) {
						const res = {
							newVal,
							oldVal,
							operations,
						};
						resolve(JSON.parse(JSON.stringify(res)));
					}
				});
			}),
	);

	// This ends up being "null" rather than a sparse array, because JSON doesn't handle sparse arrays.
	// If we really need it to, we can convert the array to an object before stringification, then convert back to an array.
	expect(ret.newVal).toEqual([null, "bar"]);
	expect(ret.oldVal).toEqual(["foo", "bar"]);
	expect(ret.operations).toEqual([
		{
			args: { prop: "0" as any },
			path: "/",
			method: "delete" as const,
		},
	]);
});

test("when an array - should proxy objects added to arrays via array insertion methods", async ({
	apis,
}) => {
	const rep = apis.extension.Replicant<Record<string, string>[]>(
		"serverArrInsertObj",
		{
			defaultValue: [],
		},
	);
	rep.value.push({ foo: "foo" });

	const promise = new Promise<void>((resolve, reject) => {
		rep.on("change", (newVal) => {
			if (!newVal) {
				reject(new Error("no value"));
				return;
			}

			if (newVal[0]?.foo === "bar") {
				expect(newVal).toEqual([{ foo: "bar" }]);
				resolve();
			}
		});
	});

	setImmediate(() => {
		rep.value[0].foo = "bar";
	});

	await promise;
});

test("when an object - should not cause server-side replicants to lose observation", async ({
	dashboard,
	apis,
}) => {
	const rep = apis.extension.Replicant<Record<string, string>>(
		"clientServerObservation",
		{
			defaultValue: { foo: "foo" },
			persistent: false,
		},
	);

	const ret = await dashboard.evaluate(
		async () =>
			new Promise((resolve, reject) => {
				let barred = false;
				const rep = window.dashboardApi.Replicant<Record<string, string>>(
					"clientServerObservation",
				);
				rep.on("change", (newVal) => {
					if (!newVal) {
						reject(new Error("no value"));
						return;
					}

					if (newVal.foo === "bar") {
						resolve(JSON.parse(JSON.stringify(newVal)));
					} else if (!barred) {
						barred = true;
						rep.value!.foo = "bar";
					}
				});
			}),
	);

	expect(ret).toEqual({ foo: "bar" });

	const promise = new Promise<void>((resolve, reject) => {
		rep.on("change", (newVal) => {
			if (!newVal) {
				reject(new Error("no value"));
				return;
			}

			if (newVal.foo === "baz") {
				resolve();
			}
		});
	});

	rep.value.foo = "baz";
	return promise;
});

test("when an object - should react to changes in nested properties", async ({
	dashboard,
}) => {
	type RepType = Record<string, any>;
	const ret = await dashboard.evaluate(
		async () =>
			new Promise<{
				newVal: RepType;
				oldVal: RepType;
				operations: NodeCG.Replicant.Operation<RepType>[];
			}>((resolve) => {
				const rep = window.dashboardApi.Replicant<RepType>("clientObjTest", {
					persistent: false,
					defaultValue: {
						a: {
							b: {
								c: "c",
							},
						},
					},
				});

				rep.on("declared", () => {
					rep.on("change", (newVal, oldVal, operations) => {
						if (newVal && oldVal && operations?.[0].method === "update") {
							resolve({
								newVal: JSON.parse(JSON.stringify(newVal)),
								oldVal,
								operations,
							});
						}
					});

					rep.value!.a.b.c = "nestedChangeOK";
				});
			}),
	);

	expect(ret.oldVal).toEqual({
		a: { b: { c: "c" } },
	});
	expect(ret.newVal).toEqual({
		a: {
			b: {
				c: "nestedChangeOK",
			},
		},
	});
	expect(ret.operations).toEqual([
		{
			args: {
				newValue: "nestedChangeOK",
				prop: "c",
			},
			path: "/a/b",
			method: "update" as const,
		},
	]);
});

// This specifically tests the following case:
// When the server has a replicant with an array nested inside an object, and that array changes,
// the server should detect that change event, emit it to all clients,
// and the clients should then digest that change and emit a "change" event.
// This test is to address a very specific bug reported by Love Olsson.
test("when an object - should react to server-side changes of array properties", async ({
	apis,
	dashboard,
}) => {
	interface RepType {
		arr: any[];
	}
	const serverRep = apis.extension.Replicant<RepType>("s2c_nestedArrTest", {
		persistent: false,
		defaultValue: {
			arr: [],
		},
	});

	await dashboard.evaluate(
		async () =>
			new Promise<void>((resolve) => {
				const rep = window.dashboardApi.Replicant<RepType>("s2c_nestedArrTest");
				rep.on("declared", () => {
					resolve();
					rep.on("change", (newVal, oldVal, operations) => {
						if (newVal && oldVal && operations) {
							(window as any).s2c_nestedArrChange = JSON.parse(
								JSON.stringify({
									newVal,
									oldVal,
									operations,
								}),
							);
						}
					});
				});
			}),
	);

	serverRep.value.arr.push("test");

	const ret = await dashboard.waitForFunction(
		() => (window as any).s2c_nestedArrChange,
	);
	const retJson: {
		newVal: RepType;
		oldVal: RepType;
		operations: NodeCG.Replicant.Operation<RepType>[];
	} = await ret.jsonValue();

	expect(retJson.newVal).toEqual({ arr: ["test"] });
	expect(retJson.oldVal).toEqual({ arr: [] });
	expect(retJson.operations).toEqual([
		{
			args: {
				mutatorArgs: ["test"],
			},
			path: "/arr",
			method: "push" as const,
		},
	]);
});

test('when an object - should support the "delete" operator', async ({
	dashboard,
}) => {
	interface RepType {
		foo?: string;
		bar: string;
	}

	const ret = await dashboard.evaluate(
		async () =>
			new Promise<{
				newVal: RepType;
				oldVal: RepType;
				operations: NodeCG.Replicant.Operation<RepType>[];
			}>((resolve, reject) => {
				const rep = window.dashboardApi.Replicant<RepType>(
					"clientObjectDelete",
					{
						defaultValue: {
							foo: "foo",
							bar: "bar",
						},
						persistent: false,
					},
				);

				let deleted = false;
				rep.on("change", (newVal, oldVal, operations) => {
					if (!newVal) {
						reject(new Error("no value"));
						return;
					}

					if (newVal.foo && !deleted) {
						delete rep.value!.foo;
						deleted = true;
					} else if (newVal.bar && !newVal.foo) {
						resolve(
							JSON.parse(
								JSON.stringify({
									newVal,
									oldVal,
									operations,
								}),
							),
						);
					}
				});
			}),
	);

	expect(ret.newVal).toEqual({ bar: "bar" });
	expect(ret.oldVal).toEqual({
		foo: "foo",
		bar: "bar",
	});
	expect(ret.operations).toEqual([
		{
			args: { prop: "foo" as const },
			path: "/",
			method: "delete" as const,
		},
	]);
});

test("when an object - should properly proxy new objects assigned to properties", async ({
	apis,
}) => {
	const rep = apis.extension.Replicant<Record<string, any>>("serverObjProp", {
		defaultValue: { foo: { bar: "bar" } },
	});

	rep.value.foo = { baz: "baz" };

	const promise = new Promise<void>((resolve, reject) => {
		rep.on("change", (newVal) => {
			if (!newVal) {
				reject(new Error("no value"));
				return;
			}

			if (newVal.foo.baz === "bax") {
				expect(newVal.foo.baz).toBe("bax");
				resolve();
			}
		});
	});

	setImmediate(() => {
		rep.value.foo.baz = "bax";
	});

	await promise;
});

test("when a date - should emit the JSON value to clients", async ({
	apis,
	dashboard,
}) => {
	const date = new Date();

	apis.extension.Replicant("clientDateTest", {
		defaultValue: date,
		persistent: false,
	});

	const ret = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				window.dashboardApi.readReplicant("clientDateTest", resolve);
			}),
	);

	expect(ret).toBe(date.toJSON());
});

test("persistent - should load persisted values when they exist", async ({
	dashboard,
}) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep = window.dashboardApi.Replicant("clientPersistence");
				rep.on("change", () => {
					resolve(rep.value);
				});
			}),
	);

	expect(ret).toBe("it work good!");
});

test("persistent - should persist assignment to disk", async ({
	dashboard,
	server,
	database,
}) => {
	await dashboard.evaluate(
		async () =>
			new Promise<void>((resolve, reject) => {
				const rep = window.dashboardApi.Replicant<any>("clientPersistence");
				rep.value = { nested: "hey we assigned!" };
				rep.on("change", (newVal) => {
					if (!newVal) {
						reject("no value");
						return;
					}

					if (newVal.nested && newVal.nested === "hey we assigned!") {
						resolve();
					}
				});
			}),
	);

	await server.saveAllReplicantsNow();

	const fromDb = await database.manager.findOneByOrFail(Replicant, {
		namespace: "test-bundle",
		name: "clientPersistence",
	});

	expect(fromDb.value).toBe('{"nested":"hey we assigned!"}');
});

test("persistent - should persist changes to disk", async ({
	apis,
	dashboard,
	server,
	database,
}) => {
	apis.extension.Replicant("clientChangePersistence", {
		defaultValue: { nested: "" },
	});

	await dashboard.evaluate(async () => {
		const rep = window.dashboardApi.Replicant<any>("clientChangePersistence");
		await window.NodeCG.waitForReplicants(rep);

		return new Promise<void>((resolve, reject) => {
			rep.on("change", (newVal) => {
				if (!newVal) {
					reject("no value");
					return;
				}

				if (newVal.nested && newVal.nested === "hey we changed!") {
					resolve();
				}
			});
			rep.value.nested = "hey we changed!";
		});
	});

	await server.saveAllReplicantsNow();

	const fromDb = await database.manager.findOneByOrFail(Replicant, {
		namespace: "test-bundle",
		name: "clientChangePersistence",
	});

	expect(fromDb.value).toBe('{"nested":"hey we changed!"}');
});

test("persistent - should persist falsey values to disk", async ({
	dashboard,
	server,
	database,
}) => {
	await dashboard.evaluate(
		async () =>
			new Promise<void>((resolve) => {
				const rep = window.dashboardApi.Replicant("clientFalseyWrite");
				rep.value = 0;
				rep.on("change", (newVal) => {
					if (newVal === 0) {
						resolve();
					}
				});
			}),
	);

	await server.saveAllReplicantsNow();

	const fromDb = await database.manager.findOneByOrFail(Replicant, {
		namespace: "test-bundle",
		name: "clientFalseyWrite",
	});

	expect(fromDb.value).toBe("0");
});

test("persistent - should read falsey values from disk", async ({
	dashboard,
}) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep = window.dashboardApi.Replicant("clientFalseyRead");
				rep.on("declared", () => {
					resolve(rep.value);
				});
			}),
	);

	expect(ret).toBe(0);
});

test("transient - should not write their value to disk", async ({
	dashboard,
	server,
	database,
}) => {
	await dashboard.evaluate(
		async () =>
			new Promise<void>((resolve) => {
				const rep = window.dashboardApi.Replicant("clientTransience", {
					defaultValue: "o no",
					persistent: false,
				});

				rep.on("declared", () => {
					resolve();
				});
			}),
	);

	await server.saveAllReplicantsNow();

	const fromDb = await database.manager.findOneBy(Replicant, {
		namespace: "test-bundle",
		name: "clientTransience",
	});

	expect(fromDb).toBe(null);
});

test("#waitForReplicants", async ({ dashboard }) => {
	await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep1 = window.dashboardApi.Replicant("wfp1");
				const rep2 = window.dashboardApi.Replicant("wfp2");
				const rep3 = window.dashboardApi.Replicant("wfp3");
				(window as any).NodeCG.waitForReplicants(rep1, rep2, rep3).then(
					resolve,
				);
			}),
	);
});

test("emits assignment in the correct order", async ({ apis, dashboard }) => {
	const extRep = apis.extension.Replicant<any[]>("assignment_order", {
		defaultValue: [],
	});

	await dashboard.evaluate(
		async () =>
			new Promise<void>((resolve) => {
				(window as any).clientRep =
					window.dashboardApi.Replicant("assignment_order");
				(window as any).clientRep.once("declared", () => {
					resolve();
				});
			}),
	);

	extRep.value.push("foo");
	extRep.value = ["bar"];

	const ret = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				(window as any).clientRep.on("change", (newVal: any) => {
					if ((window as any).clientRep.revision === 1) {
						resolve({
							// Without this JSON.parse hack,
							// newVal gets serialized as an empty object.
							// Possibly a bug in the DevTools protocol used by Puppeteer?
							newVal: JSON.parse(JSON.stringify(newVal)),
							revision: (window as any).clientRep.revision,
						});
					}
				});
			}),
	);

	// If the ordering is wrong, `ret` will be `['bar', 'foo']`.
	expect(ret).toEqual({
		newVal: ["bar"],
		revision: 1,
	});
});

test("provides accurate new and old values for assignment operations", async ({
	dashboard,
}) => {
	await dashboard.evaluate(async () => {
		const rep = window.dashboardApi.Replicant<number | undefined>(
			"clientNewAndOldValues",
		);
		let changeNumber = 0;

		await new Promise<void>((resolve, reject) => {
			rep.on("operationsRejected", (reason) => {
				reject(new Error(`Operations rejected: ${reason}`));
			});

			rep.on("change", (n, o) => {
				changeNumber += 1;

				switch (changeNumber) {
					case 1:
						if (n !== undefined || o !== undefined) {
							reject(new Error(`Test case 0 failed: n: ${n}, o: ${o}`));
							return;
						}
						break;

					case 2:
						if (n !== 1 || o !== undefined) {
							reject(new Error(`Test case 1 failed: n: ${n}, o: ${o}`));
							return;
						}
						break;

					case 3:
						if (n !== 2 || o !== 1) {
							reject(new Error(`Test case 2 failed: n: ${n}, o: ${o}`));
							return;
						}
						break;

					case 4:
						if (n === 3 && o === 2) {
							resolve();
						} else {
							reject(new Error(`Test case 3 failed: n: ${n}, o: ${o}`));
						}
						return;

					default:
						reject(new Error(`Unexpected default`));
						return;
				}

				setTimeout(() => {
					rep.value = (rep.value ?? 0) + 1;
				}, 0);
			});
		});
	});
});
