import {
	implementExtendedNamespace,
	implementNamespace,
} from "@nodecg-next/server";

import {
	baseManifest,
	chainManifest,
	crossManifest,
	extendedManifest,
	fixtureManifest,
} from "../shared/manifests.ts";

export const fixture = implementNamespace(fixtureManifest, {
	seedReplicant: {
		count: () => 0,
		scoreboard: () => ({ home: 0, away: 0 }),
		tallies: () => ({}),
		roster: () => [],
		mirrorSource: () => 0,
		mirror: () => 0,
		label: () => "hello",
		secret: () => "classified",
		producerOnly: () => "producers-only",
		membersOnly: () => "members-only",
	},
	implementComputed: {
		doubledCount: (ctx) => ctx.replicant.count.get() * 2,
		summary: (ctx) =>
			ctx.replicant.count.get() > 0
				? `${ctx.replicant.label.get()} x${ctx.replicant.count.get()}`
				: "idle",
	},
	implementRpc: {
		echo: (request: string) => request.toUpperCase(),
		bump: async (request: number, ctx) => {
			await ctx.replicant.count.update((count) => count + request);
			return ctx.replicant.count.get();
		},
	},
	frontend: {
		dir: [import.meta.resolve("../../assets/frontend")],
	},
});

const baseImplemented = implementNamespace(baseManifest, {
	seedReplicant: { score: () => 0 },
	frontend: {
		dir: [import.meta.resolve("../../assets/frontend-spa")],
		spa: true,
	},
});

export const extended = implementExtendedNamespace(
	extendedManifest,
	baseImplemented,
	{
		seedReplicant: { bonus: () => 0 },
		implementComputed: {
			total: (ctx) => ctx.replicant.score.get() + ctx.replicant.bonus.get(),
		},
		frontend: {
			dir: [import.meta.resolve("../../assets/frontend-widget")],
		},
	},
);

export const chain = implementNamespace(chainManifest, {
	seedReplicant: { points: () => 0, target: () => 0, denominator: () => 1 },
	implementComputed: {
		lead: (ctx) => ctx.replicant.points.get() - ctx.replicant.target.get(),
		status: (ctx) => {
			const lead = ctx.computed.lead.get();
			return lead > 0 ? "ahead" : lead < 0 ? "behind" : "level";
		},
		reciprocal: (ctx) => {
			const denominator = ctx.replicant.denominator.get();
			if (denominator === 0) {
				throw new Error("denominator is zero");
			}
			return 1 / denominator;
		},
	},
});

export const cross = implementNamespace(crossManifest, {
	seedReplicant: { factor: () => 2 },
	implementComputed: {
		scaledScore: (ctx) =>
			ctx.replicant.factor.get() * ctx.use(extended).replicant.score.get(),
	},
	implementRpc: {
		addScore: async (points, ctx) => {
			await ctx.use(extended).replicant.score.update((score) => score + points);
			return ctx.use(extended).replicant.score.get();
		},
	},
	children: { extended },
});
