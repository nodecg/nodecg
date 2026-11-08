import { Effect, Match, Schema } from "effect";
import type { BrowserCommand } from "vitest/node";

import { decodeBackends } from "./global-setup.ts";
import {
	restartChannelName,
	RestartReply,
	RestartRequest,
} from "./restart-channel.ts";

export const navigate: BrowserCommand<[url: string]> = async (ctx, url) => {
	const page = await ctx.context.newPage();
	try {
		const res = await page.goto(url);
		if (res === null || !res.ok()) {
			throw new Error(
				`Navigation to ${url} ended with status ${res?.status() ?? "none"}`,
			);
		}
	} finally {
		await page.close();
	}
};

class UnknownSuite extends Schema.TaggedError<UnknownSuite>()("UnknownSuite", {
	suite: Schema.String,
}) {
	override readonly message = `No server for suite "${this.suite}"`;
}

class ServerRestartError extends Schema.TaggedError<ServerRestartError>()(
	"ServerRestartError",
	{ suite: Schema.String, reason: Schema.String },
) {
	override readonly message = `Restarting the server for suite "${this.suite}" failed: ${this.reason}`;
}

const isRestartReply = Schema.is(RestartReply);

export const restartServer: BrowserCommand<[suite: string]> = (ctx, suite) =>
	Effect.runPromise(
		Effect.gen(function* () {
			const backend = decodeBackends(
				ctx.project.config.env["E2E_BACKENDS"],
			).find(({ name }) => name === suite);
			if (typeof backend === "undefined") {
				return yield* UnknownSuite.make({ suite });
			}
			const channel = yield* Effect.acquireRelease(
				Effect.sync(() => new BroadcastChannel(restartChannelName)),
				(channel) => Effect.sync(() => channel.close()),
			);
			const reply = yield* Effect.callback<typeof RestartReply.Type>(
				(resume) => {
					channel.onmessage = ({ data }) => {
						if (isRestartReply(data) && data.port === backend.port) {
							resume(Effect.succeed(data));
						}
					};
					channel.postMessage(RestartRequest.make({ port: backend.port }));
				},
			);
			yield* Match.value(reply).pipe(
				Match.tag("Restarted", () => Effect.void),
				Match.tag("RestartError", ({ message }) =>
					Effect.fail(ServerRestartError.make({ suite, reason: message })),
				),
				Match.exhaustive,
			);
		}).pipe(Effect.scoped),
	);
