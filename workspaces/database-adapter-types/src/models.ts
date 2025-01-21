export interface User {
	id: string;
	created_at: number;
	name: string;
	roles: Role[];
	identities: Identity[];
	apiKeys: ApiKey[];
}

export interface Role {
	id: string;
	name: string;
	permissions: Permission[];
}

export interface Identity {
	id: string;
	provider_type: "twitch" | "steam" | "local" | "discord";
	provider_hash: string;
	provider_access_token: string | null;
	provider_refresh_token: string | null;
	user: User;
}

export interface ApiKey {
	secret_key: string;
	user: User;
}

export interface Permission {
	id: string;
	name: string;
	role: Role;
	entityId: string;
	actions: number;
}

export interface Replicant {
	namespace: string;
	name: string;
	value: string;
}
