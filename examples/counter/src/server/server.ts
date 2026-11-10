import {
	implementNamespace,
	loadNamespace,
	makeOidcProvider,
} from "@nodecg/server";
import { OAuth2Server } from "oauth2-mock-server";

import { rootManifest } from "../shared/manifest.ts";
import { counter, settings } from "./library/server.ts";

const idp = new OAuth2Server();
await idp.issuer.keys.generate("RS256");
await idp.start(0, "localhost");
const issuer = idp.issuer.url;
if (typeof issuer === "undefined") {
	throw new Error("local OIDC server did not start");
}

const localProvider = await makeOidcProvider({
	name: "local",
	issuer,
	clientId: "example-client",
	clientSecret: "example-secret",
	allowInsecure: true,
});

process.env["NODECG_SUPERADMINS"] = "local:johndoe";

const implementedRoot = implementNamespace(rootManifest, {
	seedReplicant: { step: () => 1 },
	implementComputed: {
		parity: (ctx) =>
			ctx.children.counter.replicant.count.get() % 2 === 0 ? "even" : "odd",
		announcement: (ctx) =>
			`count is ${ctx.children.counter.replicant.count.get()} (${ctx.computed.parity.get()})`,
	},
	frontend: {
		dir: [import.meta.resolve("../../dist")],
		vite: { root: import.meta.resolve("../..") },
	},
	children: { counter, settings },
});

const loaded = await loadNamespace(implementedRoot, {
	authProviders: [localProvider],
});

await loaded.computed.parity.subscribe((parity) => {
	console.log(`[server] count is now ${parity}`);
});

loaded.start();
