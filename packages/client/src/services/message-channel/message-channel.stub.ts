import { Effect, Stream } from "effect";
import { vi } from "vitest";

import { type MessageChannel } from "./message-channel.ts";

export const createMessageChannelStub = () => {
	const send = vi.fn<MessageChannel["send"]>(() => Effect.void);
	const receive = vi.fn<MessageChannel["receive"]>(() =>
		Effect.succeed(Stream.never),
	);
	const stub = {
		send,
		receive,
		status: Stream.succeed("connected"),
	} satisfies MessageChannel;
	const reset = () => {
		for (const mock of [send, receive]) {
			mock.mockReset();
		}
	};
	return { stub, reset };
};
