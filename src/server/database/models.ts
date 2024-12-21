export type User = {
	id: string;
	created_at: number;
	name: string;
	roles: Role[];
	identities: Identity[];
	apiKeys: ApiKey[];
};

export type Role = {
	id: string;
	name: string;
	permissions: Permission[];
};

export type Identity = {
	id: string;
	provider_type: 'twitch' | 'steam' | 'local' | 'discord';
	provider_hash: string;
	provider_access_token: string | null;
	provider_refresh_token: string | null;
	user: User;
};

export type ApiKey = {
	secret_key: string;
	user: User;
};

export type Permission = {
	id: string;
	name: string;
	role: Role;
	entityId: string;
	actions: number;
};

export type Replicant = {
	namespace: string;
	name: string;
	value: string;
};
