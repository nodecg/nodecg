import { loadNamespace } from "@nodecg/client";
import { describe, expect, onTestFinished, test, vi } from "vitest";

import { suiteBase } from "../../src/client/suite-base.ts";
import { customRouteManifest } from "./manifest.ts";

const base = suiteBase("custom-route");
const routeBase = `${base}/namespaces/e2e-custom-route/custom`;

describe("custom routes", () => {
	test("an upload reaches the handler", async () => {
		const ns = await loadNamespace(customRouteManifest, { baseUrl: base });
		onTestFinished(ns.dispose);
		expect(ns.customRoute.upload.url).toBe(`${routeBase}/upload`);

		const response = await fetch(`${routeBase}/upload/logos/a.png?size=big`, {
			method: "POST",
			body: new Blob([new Uint8Array(200_000)]),
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toStrictEqual({
			pathname: "/logos/a.png",
			search: "?size=big",
		});
		await vi.waitFor(async () => {
			expect(await ns.replicant.uploadedBytes.get()).toBe(200_000);
		});
	});

	test("an upload reaches the handler through the route URL", async () => {
		const ns = await loadNamespace(customRouteManifest, { baseUrl: base });
		onTestFinished(ns.dispose);

		const response = await fetch(`${ns.customRoute.upload.url}/logos/a.png`, {
			method: "POST",
			body: new Blob([new Uint8Array(300_000)]),
		});

		expect(response.status).toBe(200);
		await vi.waitFor(async () => {
			expect(await ns.replicant.uploadedBytes.get()).toBe(300_000);
		});
	});

	test("a streamed response reaches the browser", async () => {
		const response = await fetch(`${routeBase}/stream`);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("onetwo");
	});

	test("a Hono app serves a route", async () => {
		const response = await fetch(`${routeBase}/hono/greet/ada`, {
			method: "POST",
			body: "hello",
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toStrictEqual({
			name: "ada",
			body: "hello",
		});
	});

	test("a Hono app answers its own 404", async () => {
		const response = await fetch(`${routeBase}/hono/missing`);

		expect(response.status).toBe(404);
	});

	test("an Express app serves a route", async () => {
		const response = await fetch(`${routeBase}/express/greet/ada`, {
			method: "POST",
			headers: { "Content-Type": "text/plain" },
			body: "hello",
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toStrictEqual({
			name: "ada",
			body: "hello",
		});
	});

	test("an Express app answers its own 404", async () => {
		const response = await fetch(`${routeBase}/express/missing`);

		expect(response.status).toBe(404);
	});
});
