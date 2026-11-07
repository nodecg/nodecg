import { implementNamespace } from "@nodecg-next/server";

import { timeManifest } from "./manifest.ts";

export const timeNamespace = implementNamespace(timeManifest, {
	seedReplicant: { time: () => Date.now() },
	onLoad: (ctx) => {
		const timer = setInterval(async () => {
			await ctx.replicant.time.update(
				() => Math.floor(Date.now() / 1000) * 1000,
			);
		}, 100);
		return () => {
			clearInterval(timer);
		};
	},
});
