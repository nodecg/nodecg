import { Effect, Stream } from "effect";
import { vi } from "vitest";

import { type TopicBroker } from "./topic-broker.ts";

export const createBrokerStub = () => {
	const publish = vi.fn<TopicBroker["publish"]>(() => Effect.void);
	const subscribe = vi.fn<TopicBroker["subscribe"]>(() =>
		Effect.succeed(Stream.empty),
	);
	const stub = { publish, subscribe } satisfies TopicBroker;
	const reset = () => {
		for (const mock of [publish, subscribe]) {
			mock.mockReset();
		}
	};
	return { stub, reset };
};
