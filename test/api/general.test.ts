import express from "express";
import { expect } from "vitest";

import { NodeCG } from "../../src/types/nodecg";
import { setupTest } from "../helpers/setup";
import * as C from "../helpers/test-constants";
import { invokeAck } from "../helpers/utilities";

const test = await setupTest();

test("should receive messages and fire acknowledgements", async ({
	apis,
	dashboard,
}) => {
	apis.extension.listenFor("clientToServer", (_, cb) => {
		invokeAck(cb, null);
	});
	await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				window.dashboardApi.sendMessage("clientToServer", null, resolve);
			}),
	);
});

test("should serialize errors sent to acknowledgements", async ({
	apis,
	dashboard,
}) => {
	apis.extension.listenFor("ackErrors", (_, cb) => {
		invokeAck(cb, new Error("boom"));
	});
	const res = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				window.dashboardApi.sendMessage("ackErrors", null, (err: any) => {
					resolve(err.message);
				});
			}),
	);
	expect(res).toBe("boom");
});

test("should resolve acknowledgement promises", async ({ apis, dashboard }) => {
	apis.extension.listenFor("ackPromiseResolve", (_, cb) => {
		invokeAck(cb);
	});
	const res = await dashboard.evaluate(async () =>
		window.dashboardApi.sendMessage("ackPromiseResolve").catch(),
	);
	expect(res).toBe(undefined);
});

test("should reject acknowledgement promises if there was an error", async ({
	apis,
	dashboard,
}) => {
	apis.extension.listenFor("ackPromiseReject", (_, cb) => {
		invokeAck(cb, new Error("boom"));
	});
	const res = await dashboard.evaluate(async () =>
		window.dashboardApi
			.sendMessage("ackPromiseReject")
			.then(() => new Error("Promise resolved when it should have rejected."))
			.catch((err) => err.message),
	);
	expect(res).toBe("boom");
});

test("should not return a promise if the user provided a callback ", async ({
	apis,
	dashboard,
}) => {
	apis.extension.listenFor("ackPromiseCallback", (_, cb) => {
		invokeAck(cb);
	});
	const res = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const returnVal = window.dashboardApi.sendMessage(
					"ackPromiseCallback",
					() => {
						resolve(returnVal === undefined);
					},
				);
			}),
	);
	expect(res).toBe(true);
});

test("should mount custom routes via nodecg.mount", async ({ apis }) => {
	const app = express();
	app.get("/test-bundle/test-route", (_, res) => {
		res.send("custom route confirmed");
	});
	apis.extension.mount(app);

	const response = await fetch(`${C.rootUrl()}test-bundle/test-route`);
	expect(response.status).toBe(200);
	expect(await response.text()).toBe("custom route confirmed");
});

test("should mount prefixed custom routes via nodecg.mount", async ({
	apis,
}) => {
	const app = express();
	app.get("/test-route", (_, res) => {
		res.send("custom route confirmed");
	});
	apis.extension.mount("/test-bundle", app);

	const response = await fetch(`${C.rootUrl()}test-bundle/test-route`);
	expect(response.status).toBe(200);
	expect(await response.text()).toBe("custom route confirmed");
});

test("should mount custom routes via the built-in router and nodecg.mount", async ({
	apis,
}) => {
	const app = apis.extension.Router();
	app.get("/test-bundle/test-route", (_, res) => {
		res.send("custom route confirmed");
	});
	apis.extension.mount(app);

	const response = await fetch(`${C.rootUrl()}test-bundle/test-route`);
	expect(response.status).toBe(200);
	expect(await response.text()).toBe("custom route confirmed");
});

test("should support multiple listenFor handlers", async ({
	apis,
	dashboard,
}) => {
	const promise = Promise.all([
		new Promise<void>((resolve) => {
			apis.extension.listenFor("multipleListenFor", () => {
				resolve();
			});
		}),
		new Promise<void>((resolve) => {
			apis.extension.listenFor("multipleListenFor", () => {
				resolve();
			});
		}),
	]);

	void dashboard.evaluate(() => {
		void window.dashboardApi.sendMessage("multipleListenFor");
	});

	await promise;
});

test("should prevent acknowledgements from being called more than once", async ({
	apis,
	dashboard,
}) => {
	const promise = Promise.all([
		new Promise<NodeCG.Acknowledgement | undefined>((resolve) => {
			apis.extension.listenFor("singleAckEnforcement", (_, cb) => {
				resolve(cb);
			});
		}),
		new Promise<NodeCG.Acknowledgement | undefined>((resolve) => {
			apis.extension.listenFor("singleAckEnforcement", (_, cb) => {
				resolve(cb);
			});
		}),
	]);

	void dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				window.dashboardApi.sendMessage("singleAckEnforcement", null, resolve);
			}),
	);

	const [cb1, cb2] = await promise;

	expect(cb1?.handled).toBe(false);
	expect(cb1).not.toThrow();

	expect(cb2?.handled).toBe(true);
	expect(cb2).toThrow();
});

test("server - should support intra-context messaging", async ({
	apis,
	dashboard,
}) => {
	const serverPromise = new Promise<unknown>((resolve) => {
		apis.extension.listenFor("serverToServer", (data) => {
			resolve(data);
		});
	});

	const clientPromise = dashboard.evaluate(() => {
		return new Promise((resolve) => {
			window.dashboardApi.listenFor("serverToServer", (data) => {
				resolve(data);
			});
		});
	});

	// Send the message only after both listeners have been set up.
	apis.extension.sendMessage("serverToServer", { foo: "bar" });

	expect(await serverPromise).toMatchInlineSnapshot(`
		{
		  "foo": "bar",
		}
	`);
	expect(await clientPromise).toMatchInlineSnapshot(`
		{
		  "foo": "bar",
		}
	`);
});

test("client - should support intra-context messaging", async ({
	apis,
	dashboard,
}) => {
	const data = await Promise.all([
		new Promise<unknown>((resolve) => {
			apis.extension.listenFor("clientToClient", (data) => {
				resolve(data);
			});
		}),
		dashboard.evaluate(
			() =>
				new Promise<unknown>((resolve) => {
					window.dashboardApi.listenFor("clientToClient", (data) => {
						resolve(data);
					});
					void window.dashboardApi.sendMessage("clientToClient", {
						baz: "qux",
					});
				}),
		),
	]);

	expect(data).toMatchInlineSnapshot(`
		[
		  {
		    "baz": "qux",
		  },
		  {
		    "baz": "qux",
		  },
		]
	`);
});

test("server - #bundleVersion", ({ apis }) => {
	expect(apis.extension.bundleVersion).toBe("0.0.1");
});

test("server - #bundleGit", ({ apis }) => {
	expect(apis.extension.bundleGit).toMatchInlineSnapshot(`
		{
		  "branch": "master",
		  "date": "2018-07-13T17:09:29.000Z",
		  "hash": "6262681c7f35eccd7293d57a50bdd25e4cd90684",
		  "message": "Initial commit",
		  "shortHash": "6262681",
		}
	`);
});

test("bundles replicant", ({ apis }) => {
	const bundlesRep = apis.extension.Replicant<NodeCG.Bundle[]>(
		"bundles",
		"nodecg",
	);
	expect(bundlesRep.value?.length).toBe(5);
});
