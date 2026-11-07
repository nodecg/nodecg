export {
	DuplicateNamespace,
	loadNamespaceEffect,
	loadNamespace,
	OnLoadError,
	ShutdownMessageError,
	type LoadedRoot,
	type LoadNamespaceOptions,
	type StorageOption,
} from "./load-namespace.ts";
export { NamespaceNotLoaded } from "./build-fields.ts";
export {
	type AuthProvider,
	ProviderStateMismatch,
} from "./auth/auth-provider.ts";
export {
	Authentication,
	AuthenticationId,
	GlobalRoleName,
	type Identity,
	type LoginAttempt,
	Role,
	ServiceAccountId,
	UserId,
	UserSessionId,
} from "@nodecg-next/internal";
export {
	BackendError,
	KeyTaken,
} from "./services/repository/repository-errors.ts";
export {
	OperatingSystemService,
	UnsupportedOperatingSystem,
} from "./services/operating-system/operating-system.ts";
export { DrizzleSqliteRepositories } from "./services/repository/drizzle-sqlite-repositories.ts";
export {
	type AuthenticationRepository,
	AuthenticationRepositoryService,
} from "./services/repository/authentication/authentication-repository.ts";
export {
	type LoginAttemptRepository,
	LoginAttemptRepositoryService,
} from "./services/repository/login-attempt/login-attempt-repository.ts";
export { InMemoryReplicantRepository } from "./services/repository/replicant/in-memory-replicant-repository.ts";
export { JsonFileReplicantRepository } from "./services/repository/replicant/json-file-replicant-repository.ts";
export {
	DecodeError,
	ReplicantNotFound,
	type ReplicantRepository,
	ReplicantRepositoryService,
} from "./services/repository/replicant/replicant-repository.ts";
export {
	type RoleAssignment,
	type RoleRepository,
	RoleRepositoryService,
} from "./services/repository/role/role-repository.ts";
export {
	type NewApiKey,
	type ServiceAccountRepository,
	ServiceAccountRepositoryService,
	UnknownServiceAccount,
} from "./services/repository/service-account/service-account-repository.ts";
export {
	type SessionRepository,
	SessionRepositoryService,
} from "./services/repository/session/session-repository.ts";
export {
	UnknownUser,
	type UserRepository,
	UserRepositoryService,
} from "./services/repository/user/user-repository.ts";
export { InMemoryTopicBroker } from "./services/topic-broker/in-memory-topic-broker.ts";
export {
	type TopicBroker,
	TopicBrokerService,
	type TopicMessage,
} from "./services/topic-broker/topic-broker.ts";
export {
	type Transaction,
	TransactionService,
} from "./services/transaction/transaction.ts";
export {
	makeOidcProvider,
	type OidcProviderConfig,
} from "./auth/oidc-provider.ts";
export {
	makeOAuth2Provider,
	type OAuth2ProviderConfig,
} from "./auth/oauth2-provider.ts";
export {
	implementNamespace,
	implementExtendedNamespace,
	type CrossNamespaceHandle,
	type CustomRouteContext,
	type FrontendConfig,
	type ImplementedNamespace,
	type LoadedNamespace,
	type OnLoad,
	type OnLoadContext,
	type ReplicantField,
	type ComputedField,
	type TopicField,
	type RpcField,
	type RpcContext,
	type RpcReplicantAccessor,
	type RpcComputedAccessor,
	type RpcTopicAccessor,
	type Subscribe,
	type SubscribeTopic,
} from "./implement-namespace.ts";
