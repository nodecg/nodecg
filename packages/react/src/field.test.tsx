import { FieldPermissionDenied, type ReplicantField } from "@nodecg/client";
import { type ReactNode, startTransition, Suspense } from "react";
import { createRoot, type RootOptions } from "react-dom/client";
import { expect, onTestFinished, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";

import { useField } from "./field.ts";

const error = FieldPermissionDenied.make({
	namespace: ["root"],
	name: "count",
});

const fieldStub = () => {
	const field = mock<ReplicantField<number>>();
	const { promise, resolve } = Promise.withResolvers<number>();
	field.get.mockReturnValue(promise);
	const subscribers = new Set<(value: number) => void>();
	field.subscribe.mockImplementation((onValue, onError) => {
		const deliver = (value: number) => void onValue(value, undefined);
		subscribers.add(deliver);
		void field.get().then(deliver, onError);
		return () => {
			subscribers.delete(deliver);
		};
	});
	const push = (value: number) => {
		resolve(value);
		field.get.mockResolvedValue(value);
		for (const deliver of subscribers) {
			deliver(value);
		}
	};
	return { field, push };
};

const Count = ({ field }: { field: ReplicantField<number> }) => (
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
	expect(field.subscribe).not.toHaveBeenCalled();

	push(1);
	await vi.waitFor(() => expect(container.textContent).toBe("1"));
});

test("renders a new value", async () => {
	const { push, field } = fieldStub();
	const { container } = render(<Count field={field} />);
	push(1);
	await vi.waitFor(() => expect(container.textContent).toBe("1"));

	push(2);
	await vi.waitFor(() => expect(container.textContent).toBe("2"));
});

test("throws a failure to the error boundary", async () => {
	const { field } = fieldStub();
	field.get.mockRejectedValue(error);
	const onUncaughtError = vi.fn();

	render(<Count field={field} />, { onUncaughtError });
	await vi.waitFor(() =>
		expect(onUncaughtError).toHaveBeenCalledWith(error, expect.anything()),
	);
});

test("loads again after a failed first load", async () => {
	const { push, field } = fieldStub();
	field.get.mockRejectedValue(error);
	const onUncaughtError = vi.fn();
	const { container, root } = render(<Count field={field} />, {
		onUncaughtError,
	});
	await vi.waitFor(() =>
		expect(onUncaughtError).toHaveBeenCalledWith(error, expect.anything()),
	);

	push(1);
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
	const Value = ({ field }: { field: ReplicantField<number> }) => {
		const value = useField(field);
		onRender(value);
		return <p>{value}</p>;
	};
	first.push(1);
	const { container, root } = render(<Value field={first.field} />);
	await vi.waitFor(() => expect(container.textContent).toBe("1"));

	onRender.mockClear();
	root.render(
		<LoadingBoundary>
			<Value field={second.field} />
		</LoadingBoundary>,
	);
	await vi.waitFor(() => expect(container.textContent).toContain("loading"));
	second.push(2);
	await vi.waitFor(() => expect(container.textContent).toBe("2"));

	second.push(3);
	await vi.waitFor(() => expect(container.textContent).toBe("3"));
	expect(onRender).not.toHaveBeenCalledWith(1);
});

test("keeps the old value while switching in a transition", async () => {
	const first = fieldStub();
	const second = fieldStub();
	first.push(1);
	const { container, root } = render(<Count field={first.field} />);
	await vi.waitFor(() => expect(container.textContent).toBe("1"));

	startTransition(() => {
		root.render(
			<LoadingBoundary>
				<Count field={second.field} />
			</LoadingBoundary>,
		);
	});
	await vi.waitFor(() => expect(second.field.get).toHaveBeenCalled());
	expect(container.textContent).toBe("1");
	second.push(2);
	await vi.waitFor(() => expect(container.textContent).toBe("2"));
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
	push(1);
	await vi.waitFor(() => expect(first.container.textContent).toBe("1"));
	await vi.waitFor(() => expect(field.subscribe).toHaveBeenCalled());
	first.root.unmount();
	push(2);

	onRender.mockClear();
	const second = render(<Value />);
	await vi.waitFor(() => expect(second.container.textContent).toBe("2"));
	expect(onRender).not.toHaveBeenCalledWith(1);
});
