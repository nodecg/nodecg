import { tickerNamespace } from "@nodecg-private/example-plugin-ticker/server";
import { timeNamespace } from "@nodecg-private/example-plugin-time/server";
import { implementNamespace, loadNamespace } from "@nodecg/server";

import { showManifest } from "../shared/manifest.ts";

const showNamespace = implementNamespace(showManifest, {
	seedReplicant: { title: () => "Nested namespaces" },
	children: { ticker: tickerNamespace, time: timeNamespace },
	implementComputed: {
		visibleMessages: (ctx) => {
			const now = ctx.children.time.replicant.time.get();
			return ctx.children.ticker.replicant.messages
				.get()
				.filter(({ postedAt }) => now - postedAt < 10_000)
				.map(({ text }) => text);
		},
	},
	frontend: {
		dir: [import.meta.resolve("../../dist")],
		vite: { root: import.meta.resolve("../..") },
	},
});

const loaded = await loadNamespace(showNamespace);

loaded.start();
