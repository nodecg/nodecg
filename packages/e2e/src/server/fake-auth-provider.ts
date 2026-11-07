import { randomBytes } from "node:crypto";

import {
	type AuthProvider,
	Authentication,
	ProviderStateMismatch,
} from "@nodecg-next/server";
import { Effect } from "effect";

interface SeededIdentity {
	readonly id: string;
	readonly displayName: string;
}

export const makeFakeAuthProvider = (
	name: string,
	seeded: ReadonlyArray<SeededIdentity>,
): AuthProvider => {
	const identities = new Map(seeded.map((identity) => [identity.id, identity]));
	return {
		name,
		issuer: name,
		authorize: (input) =>
			Effect.sync(() => {
				const id = input.searchParams.get("as") ?? seeded[0]?.id ?? "";
				const state = randomBytes(16).toString("base64url");
				const url = new URL(input.redirectUri);
				url.searchParams.set("state", state);
				url.searchParams.set("identity", id);
				return {
					url: `${url.pathname}${url.search}`,
					loginAttempt: { provider: name, state },
				};
			}),
		callback: Effect.fn("FakeAuthProvider.callback")(function* (input) {
			if (input.searchParams.get("state") !== input.loginAttempt.state) {
				return yield* new ProviderStateMismatch();
			}
			const id = input.searchParams.get("identity") ?? "";
			const found = identities.get(id);
			return {
				authentication: Authentication.make({ issuer: name, subject: id }),
				displayName: found?.displayName ?? id,
			};
		}),
	};
};

export const devProvider = makeFakeAuthProvider("dev", [
	{ id: "alice", displayName: "Alice" },
]);
