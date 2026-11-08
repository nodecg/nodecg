import { defineNamespace } from "@nodecg/core";
import {
	type AuthProvider,
	implementNamespace,
	loadNamespace,
	makeOAuth2Provider,
	makeOidcProvider,
} from "@nodecg/server";

const credentials = (prefix: string) => {
	const clientId = process.env[`${prefix}_CLIENT_ID`];
	const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
	if (
		typeof clientId === "undefined" ||
		clientId === "" ||
		typeof clientSecret === "undefined" ||
		clientSecret === ""
	) {
		return undefined;
	}
	return { clientId, clientSecret };
};

const providers: AuthProvider[] = [];

const discord = credentials("DISCORD");
if (typeof discord !== "undefined") {
	providers.push(
		makeOAuth2Provider({
			name: "discord",
			issuer: "https://discord.com",
			authorizationEndpoint: "https://discord.com/api/oauth2/authorize",
			tokenEndpoint: "https://discord.com/api/oauth2/token",
			userinfoEndpoint: "https://discord.com/api/users/@me",
			scopes: ["identify"],
			identityFromUserinfo: (userinfo) =>
				typeof userinfo["id"] === "string"
					? {
							subject: userinfo["id"],
							displayName:
								typeof userinfo["global_name"] === "string"
									? userinfo["global_name"]
									: typeof userinfo["username"] === "string"
										? userinfo["username"]
										: undefined,
						}
					: undefined,
			...discord,
		}),
	);
}

const twitch = credentials("TWITCH");
if (typeof twitch !== "undefined") {
	providers.push(
		await makeOidcProvider({
			name: "twitch",
			issuer: "https://id.twitch.tv/oauth2",
			scopes: ["openid"],
			// Twitch returns the token response `scope` as an array, which is not according to the OIDC spec
			transformTokenResponse: (body) => {
				const scope = body["scope"];
				if (Array.isArray(scope)) {
					return { ...body, scope: scope.join(" ") };
				}
				return body;
			},
			...twitch,
		}),
	);
}

const google = credentials("GOOGLE");
if (typeof google !== "undefined") {
	providers.push(
		await makeOidcProvider({
			name: "google",
			issuer: "https://accounts.google.com",
			...google,
		}),
	);
}

if (providers.length === 0) {
	throw new Error(
		"No login provider configured — set DISCORD_, TWITCH_, or GOOGLE_ CLIENT_ID and CLIENT_SECRET environment variables",
	);
}

const showcase = implementNamespace(defineNamespace("social-login", {}), {
	frontend: {
		dir: [import.meta.resolve("../../dist")],
		vite: { root: import.meta.resolve("../..") },
	},
});

const loaded = await loadNamespace(showcase, { authProviders: providers });

loaded.start();
