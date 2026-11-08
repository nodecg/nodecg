import { reportPageErrors } from "@nodecg/browser";
import { loadNamespace } from "@nodecg/client";
import { describe, expect, onTestFinished, test, vi } from "vitest";

import { suiteBase } from "../../src/client/suite-base.ts";
import { telemetryManifest } from "./manifest.ts";

const base = suiteBase("telemetry");

const load = async () => {
	const telemetry = await loadNamespace(telemetryManifest, { baseUrl: base });
	onTestFinished(telemetry.dispose);
	return telemetry;
};

describe("telemetry", () => {
	test("runs a request in its own trace", async () => {
		const telemetry = await load();

		await fetch(`${base}/api/internal/me?marker=root`);

		await vi.waitFor(async () => {
			const spans = await telemetry.rpc.endedSpans.call("GET");
			expect(spans).toContainEqual(
				expect.objectContaining({ root: true, query: "marker=REDACTED" }),
			);
			expect(spans.map(({ root }) => root)).not.toContain(false);
		});
	});

	test("runs a later persistence write in its own trace", async () => {
		const telemetry = await load();

		await telemetry.replicant.score.set(1);

		await vi.waitFor(async () => {
			const spans = await telemetry.rpc.endedSpans.call(
				"ReplicantRepository.write",
			);
			expect(spans).toHaveLength(2);
			expect(spans[1]?.root).toBe(true);
		});
	});

	test("redacts query values on request spans", async () => {
		const telemetry = await load();

		await fetch(`${base}/api/internal/me?code=query-secret&=unnamed-secret`);

		await vi.waitFor(async () => {
			const spans = await telemetry.rpc.endedSpans.call("GET");
			expect(spans.map(({ query }) => query)).toContain(
				"code=REDACTED&=REDACTED",
			);
		});
	});

	test("does not report a closed client as an error", async () => {
		const closing = await load();
		const telemetry = await load();

		closing.dispose();

		await vi.waitFor(async () => {
			const spans = await telemetry.rpc.endedSpans.call("GET");
			const sockets = spans.filter(({ path }) =>
				path?.endsWith("/ws/internal"),
			);
			expect(sockets).not.toHaveLength(0);
			expect(sockets.map(({ failed }) => failed)).not.toContain(true);
		});
	});

	test("leaves telemetry posts out of the server's traces", async () => {
		const telemetry = await load();

		const first = await load();
		first.reportError(new Error("first post"));
		first.dispose();
		await vi.waitFor(async () => {
			expect(await telemetry.rpc.hasExport.call("first post")).toBe(true);
		});

		const second = await load();
		second.reportError(new Error("second post"));
		second.dispose();
		await vi.waitFor(async () => {
			expect(await telemetry.rpc.hasExport.call("second post")).toBe(true);
		});

		const spans = await telemetry.rpc.endedSpans.call("POST");
		expect(
			spans.filter(({ path }) => path?.includes("/telemetry/v1/")),
		).toEqual([]);
	});

	test("exports an uncaught page error", async () => {
		const telemetry = await load();
		const page = await load();
		onTestFinished(reportPageErrors(page));

		window.dispatchEvent(
			new ErrorEvent("error", { error: new Error("uncaught failure") }),
		);
		page.dispose();

		await vi.waitFor(async () => {
			expect(await telemetry.rpc.hasExport.call("uncaught failure")).toBe(true);
		});
	});
});
