import { implementNamespace } from "@nodecg-next/server";

import { tickerManifest } from "./manifest.ts";

export const tickerNamespace = implementNamespace(tickerManifest, {
	seedReplicant: { messages: () => [] },
	implementRpc: {
		post: async (text, ctx) => {
			await ctx.replicant.messages.update((messages) => [
				...messages,
				{ text, postedAt: Date.now() },
			]);
			return ctx.replicant.messages.get().length;
		},
		clear: async (_, ctx) => {
			await ctx.replicant.messages.set([]);
			return 0;
		},
	},
});
