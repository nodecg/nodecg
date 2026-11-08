import { Effect } from "effect";
import { vi } from "vitest";

import { type FieldTransport } from "./field-transport.ts";

export const createTransportStub = () => {
	const getReplicant = vi.fn<FieldTransport["getReplicant"]>();
	const getComputed = vi.fn<FieldTransport["getComputed"]>();
	const updateReplicant = vi.fn<FieldTransport["updateReplicant"]>(
		() => Effect.void,
	);
	const publishTopic = vi.fn<FieldTransport["publishTopic"]>(() => Effect.void);
	const callRpc = vi.fn<FieldTransport["callRpc"]>();
	const stub = {
		getReplicant,
		getComputed,
		updateReplicant,
		publishTopic,
		callRpc,
	} satisfies FieldTransport;
	const reset = () => {
		for (const mock of [
			getReplicant,
			getComputed,
			updateReplicant,
			publishTopic,
			callRpc,
		]) {
			mock.mockReset();
		}
	};
	return { stub, reset };
};
