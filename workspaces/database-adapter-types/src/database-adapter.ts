import { ApiKey, Identity, Replicant, Role, User } from "./models";

type MaybePromise<T> = T | Promise<T>;

export interface DatabaseAdapter {
	findUser: (id: User["id"]) => MaybePromise<User | null>;
	getSuperUserRole: () => MaybePromise<Role>;
	upsertUser: (user: {
		name: User["name"];
		provider_type: Identity["provider_type"];
		provider_hash: Identity["provider_hash"];
		provider_access_token?: Identity["provider_access_token"];
		provider_refresh_token?: Identity["provider_refresh_token"];
		roles: User["roles"];
	}) => MaybePromise<User>;
	isSuperUser: (user: User) => boolean;
	createApiKey: () => MaybePromise<ApiKey>;
	findApiKey: (token: string) => MaybePromise<ApiKey | null>;
	saveUser: (user: User) => MaybePromise<void>;
	deleteSecretKey: (token: string) => MaybePromise<void>;
	saveReplicant: (replicant: {
		namespace: string;
		name: string;
		value: any;
		on: (event: "change", handler: (newVal: unknown) => void) => void;
		off: (event: "change", handler: (newVal: unknown) => void) => void;
	}) => Promise<void>;
	getAllReplicants: () => MaybePromise<Replicant[]>;
}
