import {
	derive,
	type DerivedHandle,
	FieldPermissionDenied,
	type FieldSource,
} from "@nodecg/client";
import { fieldSignalKey } from "@nodecg/internal";
import { signal } from "@preact/signals-core";
import { Data } from "effect";
import { type ReactNode, startTransition, Suspense } from "react";
import { createRoot, type RootOptions } from "react-dom/client";
import { expect, onTestFinished, test, vi } from "vitest";

import { useField } from "./field.ts";

type CellLoadable = ReturnType<
	FieldSource<number>[typeof fieldSignalKey]["peek"]
>;
type ReadyValue = Extract<CellLoadable, { _tag: "Ready" }>["value"];

const Loadable = Data.taggedEnum<CellLoadable>();
const ReadyValue = Data.taggedEnum<ReadyValue>();

const fieldStub = () => {
	let watching = false;
	let latest: CellLoadable = Loadable.Pending();
	const cell = signal<CellLoadable>(Loadable.Cold(), {
		watched: () => {
			watching = true;
			cell.value = latest;
		},
		unwatched: () => {
			watching = false;
			cell.value = Loadable.Cold();
		},
	});
	const push = (loadable: CellLoadable) => {
		latest = loadable;
		if (watching) {
			cell.value = loadable;
		}
	};
	const isWatched = () => watching;
	const field = derive((get) => get({ [fieldSignalKey]: cell }));
	return { push, isWatched, field };
};

const ready = (decoded: number) =>
	Loadable.Ready({ value: ReadyValue.Derived({ decoded }) });

const Count = ({ field }: { field: DerivedHandle<number> }) => (
	<p>{useField(field)}</p>
);

const LoadingBoundary = ({ children }: { children: ReactNode }) => (
	<Suspense fallback={<p>loading</p>}>{children}</Suspense>
);

const render = (node: ReactNode, options?: RootOptions) => {
	const container = document.createElement("div");
	document.body.append(container);
	const root = createRoot(container, options);
	onTestFinished(() => {
		root.unmount();
		container.remove();
	});
	root.render(<LoadingBoundary>{node}</LoadingBoundary>);
	return { container, root };
};

test("suspends until the first value", async () => {
	const { push, field } = fieldStub();

	const { container } = render(<Count field={field} />);
	await vi.waitFor(() => expect(container.textContent).toBe("loading"));

	push(ready(1));
	await vi.waitFor(() => expect(container.textContent).toBe("1"));
});

test("renders a new value", async () => {
	const { push, field } = fieldStub();
	const { container } = render(<Count field={field} />);
	push(ready(1));
	await vi.waitFor(() => expect(container.textContent).toBe("1"));

	push(ready(2));
	await vi.waitFor(() => expect(container.textContent).toBe("2"));
});

test("throws a failure to the error boundary", async () => {
	const { push, field } = fieldStub();
	const onUncaughtError = vi.fn();
	render(<Count field={field} />, { onUncaughtError });
	const error = FieldPermissionDenied.make({
		namespace: ["root"],
		name: "count",
	});

	push(Loadable.Failure({ error }));
	await vi.waitFor(() =>
		expect(onUncaughtError).toHaveBeenCalledWith(error, expect.anything()),
	);
});

test("loads again after a failed first load", async () => {
	const { push, field } = fieldStub();
	const onUncaughtError = vi.fn();
	const { container, root } = render(<Count field={field} />, {
		onUncaughtError,
	});
	const error = FieldPermissionDenied.make({
		namespace: ["root"],
		name: "count",
	});
	push(Loadable.Failure({ error }));
	await vi.waitFor(() =>
		expect(onUncaughtError).toHaveBeenCalledWith(error, expect.anything()),
	);

	push(ready(1));
	root.render(
		<LoadingBoundary>
			<Count field={field} />
		</LoadingBoundary>,
	);
	await vi.waitFor(() => expect(container.textContent).toBe("1"));
});

test("switches to another field", async () => {
	const first = fieldStub();
	const second = fieldStub();
	const onRender = vi.fn<(value: number) => void>();
	const Value = ({ field }: { field: DerivedHandle<number> }) => {
		const value = useField(field);
		onRender(value);
		return <p>{value}</p>;
	};
	onTestFinished(first.field[fieldSignalKey].subscribe(() => {}));
	first.push(ready(1));
	const { container, root } = render(<Value field={first.field} />);
	await vi.waitFor(() => expect(container.textContent).toBe("1"));

	onRender.mockClear();
	root.render(
		<LoadingBoundary>
			<Value field={second.field} />
		</LoadingBoundary>,
	);
	await vi.waitFor(() => expect(container.textContent).toContain("loading"));
	second.push(ready(2));
	await vi.waitFor(() => expect(container.textContent).toBe("2"));

	second.push(ready(3));
	await vi.waitFor(() => expect(container.textContent).toBe("3"));
	expect(onRender).not.toHaveBeenCalledWith(1);
});

test("keeps the old value while switching in a transition", async () => {
	const first = fieldStub();
	const second = fieldStub();
	onTestFinished(first.field[fieldSignalKey].subscribe(() => {}));
	first.push(ready(1));
	const { container, root } = render(<Count field={first.field} />);
	await vi.waitFor(() => expect(container.textContent).toBe("1"));

	startTransition(() => {
		root.render(
			<LoadingBoundary>
				<Count field={second.field} />
			</LoadingBoundary>,
		);
	});
	await vi.waitFor(() => expect(second.isWatched()).toBe(true));
	expect(container.textContent).toBe("1");
	second.push(ready(2));
	await vi.waitFor(() => expect(container.textContent).toBe("2"));
});

test("keeps the value while a derive starts reading a cold field", async () => {
	const choice = fieldStub();
	const other = fieldStub();
	const picked = derive((get) =>
		get(choice.field) === 0 ? 0 : get(other.field),
	);
	choice.push(ready(0));
	const { container } = render(<Count field={picked} />);
	await vi.waitFor(() => expect(container.textContent).toBe("0"));

	choice.push(ready(1));
	await vi.waitFor(() => expect(other.isWatched()).toBe(true));
	expect(container.textContent).toBe("0");
	other.push(ready(5));
	await vi.waitFor(() => expect(container.textContent).toBe("5"));
});

test("loads again after a remount", async () => {
	const { push, field } = fieldStub();
	const onRender = vi.fn<(value: number) => void>();
	const Value = () => {
		const value = useField(field);
		onRender(value);
		return <p>{value}</p>;
	};
	const first = render(<Value />);
	push(ready(1));
	await vi.waitFor(() => expect(first.container.textContent).toBe("1"));
	first.root.unmount();
	push(ready(2));

	onRender.mockClear();
	const second = render(<Value />);
	await vi.waitFor(() => expect(second.container.textContent).toBe("2"));
	expect(onRender).not.toHaveBeenCalledWith(1);
});
