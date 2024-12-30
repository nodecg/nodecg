import { expect } from "vitest";

import { setupTest } from "./helpers/setup";

const test = await setupTest();

test("should create a default value based on the schema, if none is provided", async ({
	dashboard,
}) => {
	const res = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep = window.dashboardApi.Replicant("client_schemaDefaults");
				rep.on("declared", () => {
					resolve(JSON.parse(JSON.stringify(rep.value)));
				});
			}),
	);

	expect(res).toEqual({
		string: "",
		object: {
			numA: 0,
		},
	});
});

test("should accept the defaultValue when it passes validation", async ({
	dashboard,
}) => {
	const res = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep = window.dashboardApi.Replicant(
					"client_schemaDefaultValuePass",
					{
						defaultValue: {
							string: "foo",
							object: {
								numA: 1,
							},
						},
					},
				);
				rep.on("declared", () => {
					resolve(JSON.parse(JSON.stringify(rep.value)));
				});
			}),
	);

	expect(res).toEqual({
		string: "foo",
		object: {
			numA: 1,
		},
	});
});

test("should throw when defaultValue fails validation", async ({
	dashboard,
}) => {
	const res = await dashboard.evaluate(
		async () =>
			new Promise<string>((resolve) => {
				const rep = window.dashboardApi.Replicant(
					"client_schemaDefaultValueFail",
					{
						defaultValue: {
							string: 0,
						},
					},
				);

				rep.once("declarationRejected", (reason) => {
					resolve(reason);
				});
			}),
	);

	expect(res).toMatchInlineSnapshot(`
		"Invalid value rejected for replicant "client_schemaDefaultValueFail" in namespace "test-bundle":
		string must be string"
	`);
});

test("should accept the persisted value when it passes validation", async ({
	dashboard,
}) => {
	// Persisted value is already preloaded into the test database
	const res = await dashboard.evaluate(
		async () =>
			new Promise((resolve, reject) => {
				const rep = window.dashboardApi.Replicant(
					"client_schemaPersistencePass",
				);
				rep.on("declarationRejected", reject);
				rep.on("declared", () => {
					resolve(JSON.parse(JSON.stringify(rep.value)));
				});
			}),
	);

	expect(res).toEqual({
		string: "foo",
		object: {
			numA: 1,
		},
	});
});

test("should reject the persisted value when it fails validation, replacing with schemaDefaults", async ({
	dashboard,
}) => {
	// Persisted value is copied from fixtures
	const res = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep = window.dashboardApi.Replicant(
					"client_schemaPersistenceFail",
				);
				rep.on("declared", () => {
					resolve(JSON.parse(JSON.stringify(rep.value)));
				});
			}),
	);

	expect(res).toEqual({
		string: "",
		object: {
			numA: 0,
		},
	});
});

test("should accept valid assignment", async ({ dashboard }) => {
	const res = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep = window.dashboardApi.Replicant<any>(
					"client_schemaAssignPass",
				);
				rep.once("declared", () => {
					rep.value = {
						string: "foo",
						object: {
							numA: 1,
						},
					};

					rep.on("change", (newVal) => {
						if (newVal.string === "foo") {
							resolve(JSON.parse(JSON.stringify(rep.value)));
						}
					});
				});
			}),
	);

	expect(res).toEqual({
		string: "foo",
		object: {
			numA: 1,
		},
	});
});

test("should throw on invalid assignment", async ({ dashboard }) => {
	const res = await dashboard.evaluate(
		async () =>
			new Promise<string>((resolve) => {
				const rep = window.dashboardApi.Replicant("client_schemaAssignFail");
				rep.once("declared", () => {
					try {
						rep.value = {
							string: 0,
						};
					} catch (e: any) {
						resolve(e.message);
					}
				});
			}),
	);

	expect(res).toMatchInlineSnapshot(`
		"Invalid value rejected for replicant "client_schemaAssignFail" in namespace "test-bundle":
		string must be string"
	`);
});

test("should accept valid property deletion", async ({ dashboard }) => {
	const res = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep = window.dashboardApi.Replicant<any>(
					"client_schemaDeletionPass",
				);
				rep.once("declared", () => {
					delete rep.value.object.numB;
					rep.on("change", (newVal) => {
						if (!newVal.object.numB) {
							resolve(JSON.parse(JSON.stringify(rep.value)));
						}
					});
				});
			}),
	);

	expect(res).toEqual({
		string: "",
		object: {
			numA: 0,
		},
	});
});

test("should throw on invalid property deletion", async ({ dashboard }) => {
	const res = await dashboard.evaluate(
		async () =>
			new Promise<string>((resolve) => {
				const rep = window.dashboardApi.Replicant<any>(
					"client_schemaDeletionFail",
				);
				rep.once("declared", () => {
					try {
						delete rep.value.object.numA;
					} catch (e: any) {
						resolve(e.message);
					}
				});
			}),
	);

	expect(res).toMatchInlineSnapshot(`
		"Invalid value rejected for replicant "client_schemaDeletionFail" in namespace "test-bundle":
		object must have required property 'numA'"
	`);
});

test("should accept valid array mutation via array mutator methods", async ({
	dashboard,
}) => {
	const res = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep = window.dashboardApi.Replicant<any>(
					"client_schemaArrayMutatorPass",
				);
				rep.once("declared", () => {
					rep.value.array.push("foo");
					rep.on("change", (newVal) => {
						if (newVal.array.length === 1) {
							resolve(JSON.parse(JSON.stringify(rep.value)));
						}
					});
				});
			}),
	);

	expect(res).toEqual({
		string: "",
		array: ["foo"],
	});
});

test("should throw on invalid array mutation via array mutator methods", async ({
	dashboard,
}) => {
	const res = await dashboard.evaluate(
		async () =>
			new Promise<string>((resolve) => {
				const rep = window.dashboardApi.Replicant<any>(
					"client_schemaArrayMutatorFail",
				);
				rep.once("declared", () => {
					try {
						rep.value.array.push(0);
					} catch (e: any) {
						resolve(e.message);
					}
				});
			}),
	);

	expect(res).toMatchInlineSnapshot(`
		"Invalid value rejected for replicant "client_schemaArrayMutatorFail" in namespace "test-bundle":
		array/0 must be string"
	`);
});

test("should accept valid property changes to arrays", async ({
	dashboard,
}) => {
	const res = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep = window.dashboardApi.Replicant<any>(
					"client_schemaArrayChangePass",
				);
				rep.once("declared", () => {
					rep.value.array[0] = "bar";
					rep.on("change", (newVal) => {
						if (newVal.array[0] === "bar") {
							resolve(JSON.parse(JSON.stringify(rep.value)));
						}
					});
				});
			}),
	);

	expect(res).toEqual({
		string: "",
		array: ["bar"],
	});
});

test("should throw on invalid property changes to arrays", async ({
	dashboard,
}) => {
	const res = await dashboard.evaluate(
		async () =>
			new Promise<string>((resolve) => {
				const rep = window.dashboardApi.Replicant<any>(
					"client_schemaArrayChangeFail",
				);
				rep.once("declared", () => {
					try {
						rep.value.array[0] = 0;
					} catch (e: any) {
						resolve(e.message);
					}
				});
			}),
	);

	expect(res).toMatchInlineSnapshot(`
		"Invalid value rejected for replicant "client_schemaArrayChangeFail" in namespace "test-bundle":
		array/0 must be string"
	`);
});

test("should accept valid property changes to objects", async ({
	dashboard,
}) => {
	const res = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep = window.dashboardApi.Replicant<any>(
					"client_schemaObjectChangePass",
				);
				rep.once("declared", () => {
					rep.value.object.numA = 1;
					rep.on("change", (newVal) => {
						if (newVal.object.numA === 1) {
							resolve(JSON.parse(JSON.stringify(rep.value)));
						}
					});
				});
			}),
	);

	expect(res).toEqual({
		string: "",
		object: {
			numA: 1,
		},
	});
});

test("should throw on invalid property changes to objects", async ({
	dashboard,
}) => {
	const res = await dashboard.evaluate(
		async () =>
			new Promise<string>((resolve) => {
				const rep = window.dashboardApi.Replicant<any>(
					"client_schemaObjectChangeFail",
				);
				rep.once("declared", () => {
					try {
						rep.value.object.numA = "foo";
					} catch (e: any) {
						resolve(e.message);
					}
				});
			}),
	);

	expect(res).toMatchInlineSnapshot(`
		"Invalid value rejected for replicant "client_schemaObjectChangeFail" in namespace "test-bundle":
		object/numA must be number"
	`);
});

test("should reject assignment if it was validated against a different version of the schema", async ({
	dashboard,
}) => {
	const res = await dashboard.evaluate(
		async () =>
			new Promise<string>((resolve) => {
				const rep = window.dashboardApi.Replicant(
					"client_schemaAssignMismatch",
				);
				rep.once("declared", () => {
					rep.schemaSum = "baz";
					try {
						rep.value = {
							string: "foo",
							object: {
								numA: 1,
							},
						};
					} catch (e: any) {
						resolve(e.message);
					}
				});

				rep.once("operationsRejected", (reason) => {
					resolve(reason);
				});
			}),
	);

	expect(res).toMatchInlineSnapshot(
		`"Mismatched schema version, assignment rejected"`,
	);
});

test("should reject mutations if they were validated against a different version of the schema", async ({
	dashboard,
}) => {
	const res = await dashboard.evaluate(
		async () =>
			new Promise<string>((resolve) => {
				const rep = window.dashboardApi.Replicant<any>(
					"client_schemaOperationMismatch",
				);
				rep.once("declared", () => {
					rep.schemaSum = "baz";
					try {
						rep.value.object.numA = 1;
					} catch (e: any) {
						resolve(e.message);
					}
				});

				rep.once("operationsRejected", (reason) => {
					resolve(reason);
				});
			}),
	);

	expect(res).toMatchInlineSnapshot(
		`"Mismatched schema version, assignment rejected"`,
	);
});

// This isn't _actually_ testing schemas, it's just a bug that is easiest to detect when using a schema.
// The problem was that certain cases were assigning incorrect paths to the metadataMap.
// This use case (from another project) just so happened to trigger this error.
// I more or less copied that code and schema directly here just to write the test as fast as possible.
// This test should probably be re-written to be more targeted and remove any cruft.
// Lange - 2017/05/04
test("shouldn't fuck up", async ({ dashboard }) => {
	const res = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep = window.dashboardApi.Replicant<{ matchMap: boolean[] }>(
					"schedule:state",
				);
				rep.once("declared", () => {
					rep.value!.matchMap = [
						false,
						false,
						false,
						false,
						false,
						false,
						false,
						false,
					];

					rep.on("change", (newVal) => {
						if (!newVal?.matchMap.includes(true)) {
							try {
								rep.value!.matchMap[6] = true;
								resolve(true);
							} catch (e: any) {
								resolve(e.message);
							}
						}
					});
				});
			}),
	);

	expect(res).toBe(true);
});
