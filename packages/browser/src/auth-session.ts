import {
	loadAuthClient,
	type AuthClient,
	type Identity,
	type MePayload,
} from "@nodecg-next/client";
import { AnonymousIdentitySchema } from "@nodecg-next/internal";

import { nodecgBase } from "./base.ts";

export interface AuthSession {
	readonly client: AuthClient;
	readonly identity: {
		readonly get: () => Identity | undefined;
		readonly subscribe: (callback: () => void) => () => void;
	};
	readonly logout: () => Promise<void>;
	readonly refresh: () => Promise<MePayload>;
}

export const authSession = (
	client: AuthClient = loadAuthClient(nodecgBase()),
): AuthSession => {
	const listeners = new Set<() => void>();
	let current: Identity | undefined;
	const setIdentity = (identity: Identity) => {
		current = identity;
		for (const listener of listeners) {
			listener();
		}
	};

	const refresh = async () => {
		const payload = await client.me();
		setIdentity(payload.identity);
		return payload;
	};
	void refresh().catch(() => undefined);

	const logout = async () => {
		await client.logout();
		setIdentity(AnonymousIdentitySchema.make({}));
	};

	return {
		client,
		identity: {
			get: () => current,
			subscribe: (callback) => {
				listeners.add(callback);
				return () => {
					listeners.delete(callback);
				};
			},
		},
		logout,
		refresh,
	};
};
