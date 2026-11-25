import { FieldPermissionDenied, loadNamespace } from "@nodecg/client";
import { useField } from "@nodecg/react";
import { type ReactNode, Suspense } from "react";
import { createRoot, type RootOptions } from "react-dom/client";
import { beforeAll, expect, onTestFinished, test, vi } from "vitest";

import { makeAuthHelpers } from "../../src/client/auth.ts";
import { suiteBase } from "../../src/client/suite-base.ts";
import { replicantSyncManifest } from "./manifest.ts";

const base = suiteBase("replicant-sync");
const { logout } = makeAuthHelpers(base);

beforeAll(async () => {
	await logout();
});

const render = (node: ReactNode, options?: RootOptions) => {
	const container = document.createElement("div");
	document.body.append(container);
	const root = createRoot(container, options);
	onTestFinished(() => {
		root.unmount();
		container.remove();
	});
	root.render(<Suspense fallback={<p>loading</p>}>{node}</Suspense>);
	return container;
};

test("renders a replicant and its updates", async () => {
	const root = await loadNamespace(replicantSyncManifest, { baseUrl: base });
	onTestFinished(root.dispose);
	const { mirrorSource } = root.children.fixture.replicant;
	await mirrorSource.set(1234);
	const Value = () => <p>{useField(mirrorSource)}</p>;

	const container = render(<Value />);
	await vi.waitFor(() => expect(container.textContent).toBe("1234"));

	await mirrorSource.set(5678);
	await vi.waitFor(() => expect(container.textContent).toBe("5678"));
});

test("renders a computed", async () => {
	const root = await loadNamespace(replicantSyncManifest, { baseUrl: base });
	onTestFinished(root.dispose);
	const { summary } = root.children.fixture.computed;
	const Value = () => <p>{useField(summary)}</p>;

	const container = render(<Value />);
	await vi.waitFor(async () =>
		expect(container.textContent).toBe(await summary.get()),
	);
});

test("throws a denied read to the error boundary", async () => {
	const root = await loadNamespace(replicantSyncManifest, { baseUrl: base });
	onTestFinished(root.dispose);
	const { producerOnly } = root.children.fixture.replicant;
	const Value = () => <p>{useField(producerOnly)}</p>;
	const onUncaughtError = vi.fn();

	render(<Value />, { onUncaughtError });
	await vi.waitFor(() =>
		expect(onUncaughtError).toHaveBeenCalledWith(
			FieldPermissionDenied.make({
				namespace: ["e2e-replicant-sync", "fixture"],
				name: "producerOnly",
			}),
			expect.anything(),
		),
	);
});
