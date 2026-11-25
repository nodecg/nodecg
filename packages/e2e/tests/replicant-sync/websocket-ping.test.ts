import { expect, onTestFinished, test, vi } from "vitest";

import { suiteBase } from "../../src/client/suite-base.ts";

const openSocket = async () => {
	const url = new URL(`${suiteBase("replicant-sync")}/ws/internal`);
	url.protocol = "ws:";
	const socket = new WebSocket(url);
	onTestFinished(() => socket.close());
	await new Promise((resolve) => {
		socket.addEventListener("open", resolve, { once: true });
	});
	return socket;
};

test("answers a ping with a pong", async () => {
	const socket = await openSocket();
	const replies: unknown[] = [];
	socket.onmessage = (event) => replies.push(event.data);
	socket.send('{"_tag":"ping"}');

	await vi.waitFor(() => expect(replies).toEqual(['{"_tag":"pong"}']));
});

test("keeps the connection after a frame that does not decode", async () => {
	const socket = await openSocket();
	const replies: unknown[] = [];
	socket.onmessage = (event) => replies.push(event.data);
	socket.send('{"_tag":"unknown"}');
	socket.send('{"_tag":"ping"}');

	await vi.waitFor(() => expect(replies).toEqual(['{"_tag":"pong"}']));
});
