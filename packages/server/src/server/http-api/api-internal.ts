import { timingSafeEqual } from "node:crypto";

import {
	CurrentIdentity,
	CurrentSessionUser,
	CurrentUser,
	UserDocumentEntry,
	ServiceAccountDocumentEntry,
	RoleAssignmentsDocument,
	sessionCookieName,
	SuperadminRevokeRefused,
	TooManyRequests,
} from "@nodecg-next/internal";
import { MalformedUrl, parseRelativeUrl } from "@nodecg-next/internal/utils";
import {
	Array,
	Clock,
	type Config,
	type Duration,
	Effect,
	HashMap,
	HashSet,
	Layer,
	Match,
	Option,
	type PlatformError,
	Redacted,
	Ref,
	Result,
	Semaphore,
} from "effect";
import { Digest } from "effect/crypto";
import { HttpServerRequest, HttpServerResponse, Url } from "effect/http";
import { HttpApiBuilder, HttpApiError } from "effect/http-api";

import { AuthProviderRegistry } from "../../auth/auth-provider.ts";
import { getSessionIdentity } from "../../auth/identity.ts";
import {
	consumeLoginAttempt,
	createLoginAttempt,
} from "../../auth/login-attempt.ts";
import { superadminExists } from "../../auth/roles.ts";
import {
	createServiceAccount,
	hashApiKey,
	newApiKey,
} from "../../auth/service-accounts.ts";
import {
	cookieOptions,
	createSession,
	revokeSession,
	setSessionCookie,
} from "../../auth/session.ts";
import { grantGlobalRole, revokeGlobalRole } from "../../auth/users.ts";
import { ConfiguredSuperadmins } from "../../configured-superadmins.ts";
import { listPermissions } from "../../list-permissions.ts";
import { NamespaceRegistryService } from "../../namespace-registry.ts";
import { config } from "../../server-config.ts";
import { AuthenticationRepositoryService } from "../../services/repository/authentication/authentication-repository.ts";
import type { BackendError } from "../../services/repository/repository-errors.ts";
import { RoleRepositoryService } from "../../services/repository/role/role-repository.ts";
import { ServiceAccountRepositoryService } from "../../services/repository/service-account/service-account-repository.ts";
import { UserRepositoryService } from "../../services/repository/user/user-repository.ts";
import { TransactionService } from "../../services/transaction/transaction.ts";
import { BrowserTelemetry } from "../browser-telemetry.ts";
import { RootApi } from "../root-api.ts";
import { UrlPath } from "../url-path.ts";
import {
	callRpc,
	getComputed,
	getReplicant,
	publishTopic,
	updateReplicant,
} from "./shared.ts";

const loginAttemptCookieName = "nodecg.login_attempt";

const provideIdentity = Effect.provideServiceEffect(
	CurrentIdentity,
	Effect.gen(function* () {
		const caller = yield* CurrentSessionUser;
		return getSessionIdentity(caller);
	}),
);

// TODO: get this path from Effect HttpApi
const callbackUrl = Effect.fn("callbackUrl")(function* (
	baseUrl: string,
	provider: string,
) {
	const path = yield* UrlPath;
	const url = yield* Url.fromString(baseUrl).pipe(
		Result.mapError((error) =>
			MalformedUrl.make({ url: baseUrl, cause: error.cause }),
		),
		Effect.fromResult,
	);
	return Url.setPathname(
		url,
		path.join(url.pathname, "api/internal/authentication/callback", provider),
	).href;
});

const loginUrl = Effect.fn("loginUrl")(function* (
	baseUrl: string,
	provider: string,
) {
	const path = yield* UrlPath;
	const url = yield* Url.fromString(baseUrl).pipe(
		Result.mapError((error) =>
			MalformedUrl.make({ url: baseUrl, cause: error.cause }),
		),
		Effect.fromResult,
	);
	return Url.setPathname(
		url,
		path.join(url.pathname, "api/internal/authentication/login", provider),
	);
});

const tokenEquals = Effect.fnUntraced(function* (
	expected: Redacted.Redacted<string>,
	provided: Redacted.Redacted<string>,
) {
	const digest = yield* Digest.Digest;
	const encoder = new TextEncoder();
	const expectedDigest = yield* digest.digest(
		Digest.sha256,
		encoder.encode(Redacted.value(expected)),
	);
	const providedDigest = yield* digest.digest(
		Digest.sha256,
		encoder.encode(Redacted.value(provided)),
	);
	return timingSafeEqual(expectedDigest, providedDigest);
});

const CLAIM_ATTEMPT_LIMIT = 5;
const CLAIM_ATTEMPT_WINDOW_MILLIS = 60_000;

const reportBackendFailure = <A, E, R>(
	effect: Effect.Effect<
		A,
		E | BackendError | Config.ConfigError | PlatformError.PlatformError,
		R
	>,
) =>
	effect.pipe(
		Effect.tapDefect((defect) => Effect.logError("Backend failed", defect)),
		Effect.catchTag(["BackendError", "ConfigError", "PlatformError"], (error) =>
			Effect.logError("Backend failed", error).pipe(
				Effect.andThen(HttpApiError.InternalServerError.make()),
			),
		),
	);

const AuthenticationGroupLive = HttpApiBuilder.group(
	RootApi,
	"Authentication",
	(handlers) =>
		Effect.gen(function* () {
			const baseUrl = yield* config.baseUrl;
			const loginAttemptTtl = yield* config.loginAttemptTtl;
			const sessionTtl = yield* config.sessionTtl;

			const setLoginAttemptCookie =
				(value: string, maxAge: Duration.Input) =>
				(response: HttpServerResponse.HttpServerResponse) =>
					response.pipe(
						HttpServerResponse.setCookie(loginAttemptCookieName, value, {
							...cookieOptions,
							path: baseUrl.pathname,
							maxAge,
						}),
						// TODO: is this a correct silencing?
						Effect.catchTag("CookiesError", () =>
							HttpApiError.InternalServerError.make(),
						),
					);
			const clearLoginAttemptCookie = setLoginAttemptCookie("", 0);

			const registry = yield* AuthProviderRegistry;

			// superadmin claim resources
			const claimToken = yield* config.superadminClaimToken;
			const claimLock = yield* Semaphore.make(1);
			// Rate limiting is global on purpose to avoid attacker to abuse IdP issued tokens
			const claimAttempts = yield* Ref.make<ReadonlyArray<number>>([]);

			return handlers
				.handle("me", () =>
					Effect.gen(function* () {
						const identity = yield* CurrentIdentity;
						return { identity, namespaces: yield* listPermissions(identity) };
					}).pipe(provideIdentity),
				)
				.handle("providers", () =>
					Effect.forEach(
						Array.fromIterable(HashMap.keys(registry)).toSorted(),
						(name) =>
							loginUrl(baseUrl.href, name).pipe(
								Effect.map((url) => ({ name, url })),
							),
					),
				)
				.handle("login", ({ params: { provider: name }, query }) =>
					Effect.gen(function* () {
						const request = yield* HttpServerRequest.HttpServerRequest;
						const provider = HashMap.get(registry, name);
						if (Option.isNone(provider)) {
							return HttpServerResponse.text(
								"Unknown authentication provider",
								{ status: 404 },
							);
						}
						const requestUrl = yield* Effect.fromResult(
							parseRelativeUrl(request.url),
						);
						const redirect = yield* provider.value
							.authorize({
								redirectUri: yield* callbackUrl(baseUrl.href, name),
								searchParams: new URLSearchParams(requestUrl.search),
							})
							.pipe(Effect.result);
						if (Result.isFailure(redirect)) {
							return HttpServerResponse.text(
								"Authentication provider unavailable",
								{ status: 502 },
							);
						}
						const authorized = redirect.success.loginAttempt;
						const key = yield* createLoginAttempt({
							provider: authorized.provider,
							state: authorized.state,
							codeVerifier: authorized.codeVerifier,
							nonce: authorized.nonce,
							returnTo: query.returnTo,
						}).pipe(reportBackendFailure);
						return yield* HttpServerResponse.redirect(redirect.success.url, {
							status: 302,
						}).pipe(setLoginAttemptCookie(key, loginAttemptTtl));
					}),
				)
				.handle("callback", ({ params: { provider: name } }) =>
					Effect.gen(function* () {
						const request = yield* HttpServerRequest.HttpServerRequest;
						const provider = HashMap.get(registry, name);
						if (Option.isNone(provider)) {
							return HttpServerResponse.text(
								"Unknown authentication provider",
								{
									status: 404,
								},
							);
						}
						const loginAttemptKey = request.cookies[loginAttemptCookieName];
						if (typeof loginAttemptKey === "undefined") {
							return yield* HttpServerResponse.text(
								"Invalid or missing login state",
								{ status: 400 },
							).pipe(clearLoginAttemptCookie);
						}
						const loginAttempt =
							yield* consumeLoginAttempt(loginAttemptKey).pipe(
								reportBackendFailure,
							);
						if (Option.isNone(loginAttempt)) {
							return yield* HttpServerResponse.text(
								"Invalid or missing login state",
								{ status: 400 },
							).pipe(clearLoginAttemptCookie);
						}
						const requestUrl = yield* Effect.fromResult(
							parseRelativeUrl(request.url),
						);
						const authenticated = yield* provider.value
							.callback({
								redirectUri: yield* callbackUrl(baseUrl.href, name),
								searchParams: new URLSearchParams(requestUrl.search),
								loginAttempt: loginAttempt.value,
							})
							.pipe(
								Effect.tapCause((cause) =>
									Effect.logError("Authentication callback failed", cause),
								),
								Effect.result,
							);
						if (Result.isFailure(authenticated)) {
							return yield* Match.value(authenticated.failure).pipe(
								Match.tag("ProviderStateMismatch", () =>
									HttpServerResponse.text("OAuth state mismatch", {
										status: 400,
									}).pipe(clearLoginAttemptCookie),
								),
								Match.tag("ProviderUnavailableError", () =>
									HttpServerResponse.text(
										"Authentication provider unavailable",
										{ status: 502 },
									).pipe(clearLoginAttemptCookie),
								),
								Match.tag("CredentialExchangeError", () =>
									HttpServerResponse.text("Authentication failed", {
										status: 400,
									}).pipe(clearLoginAttemptCookie),
								),
								Match.tag("ProviderResponseError", () =>
									HttpServerResponse.text(
										"Authentication provider unavailable",
										{ status: 502 },
									).pipe(clearLoginAttemptCookie),
								),
								Match.tag("NoIdentity", () =>
									HttpServerResponse.text("Authentication failed", {
										status: 400,
									}).pipe(clearLoginAttemptCookie),
								),
								Match.exhaustive,
							);
						}
						const token = yield* createSession(
							authenticated.success.authentication,
							authenticated.success.displayName,
						).pipe(reportBackendFailure);
						yield* setSessionCookie(token, {
							path: baseUrl.pathname,
							maxAge: sessionTtl,
						});
						return yield* HttpServerResponse.redirect(
							loginAttempt.value.returnTo ?? baseUrl.pathname,
							{ status: 302 },
						).pipe(clearLoginAttemptCookie);
					}),
				)
				.handle("logout", () =>
					Effect.gen(function* () {
						const request = yield* HttpServerRequest.HttpServerRequest;
						const token = request.cookies[sessionCookieName];
						if (typeof token !== "undefined") {
							yield* revokeSession(token).pipe(
								Effect.tapCause((cause) =>
									Effect.logError("Logout failed", cause),
								),
								Effect.catchTag("BackendError", () =>
									HttpApiError.InternalServerError.make(),
								),
							);
						}
						yield* setSessionCookie("", { path: baseUrl.pathname, maxAge: 0 });
						return HttpServerResponse.empty({ status: 204 });
					}),
				)
				.handle("claimSuperadmin", ({ payload: { token } }) =>
					Effect.gen(function* () {
						const caller = yield* CurrentSessionUser;
						// Gate unauthenticated users to consume rate limit
						if (Option.isNone(caller)) {
							return yield* HttpApiError.Unauthorized.make();
						}

						const now = yield* Clock.currentTimeMillis;
						const recent = (yield* Ref.get(claimAttempts)).filter(
							(at) => now - at < CLAIM_ATTEMPT_WINDOW_MILLIS,
						);
						if (recent.length >= CLAIM_ATTEMPT_LIMIT) {
							return yield* TooManyRequests.make({
								message: "Too many superadmin claim attempts, try again later",
							});
						}
						yield* Ref.set(claimAttempts, [...recent, now]);

						if (Option.isNone(claimToken)) {
							return yield* HttpApiError.Forbidden.make();
						}
						if (
							(yield* superadminExists()) ||
							!(yield* tokenEquals(claimToken.value, token))
						) {
							return yield* HttpApiError.Forbidden.make();
						}

						yield* grantGlobalRole(caller.value.id, "superadmin");
					}).pipe(
						Effect.catchTag("UnknownUser", () => HttpApiError.Forbidden.make()),
						reportBackendFailure,
						claimLock.withPermits(1),
					),
				);
		}),
);

const UsersGroupLive = HttpApiBuilder.group(RootApi, "Users", (handlers) =>
	handlers
		.handle("list", () =>
			Effect.gen(function* () {
				const userRepository = yield* UserRepositoryService;
				const superadmins = yield* ConfiguredSuperadmins;
				const users = yield* userRepository.listAll();
				return {
					users: users.map(
						({ id, displayName, authentications, roles, globalRoles }) => ({
							id,
							displayName,
							authentications,
							roles,
							globalRoles: Array.isArrayNonEmpty(
								Array.intersection(authentications, superadmins),
							)
								? Array.union(globalRoles, ["superadmin"] as const)
								: globalRoles,
						}),
					),
				};
			}).pipe(reportBackendFailure),
		)
		.handle("grantRole", ({ params: { id }, payload: role }) =>
			Effect.gen(function* () {
				const { declaredRoles } = yield* NamespaceRegistryService;
				if (!declaredRoles.get(role.namespace)?.has(role.name)) {
					return yield* HttpApiError.UnprocessableEntity.make();
				}
				const users = yield* UserRepositoryService;
				yield* users.grantRoles(id, HashSet.make(role));
			}).pipe(
				Effect.catchTag("UnknownUser", () => HttpApiError.NotFound.make()),
				reportBackendFailure,
			),
		)
		.handle("revokeRole", ({ params: { id }, payload: role }) =>
			Effect.gen(function* () {
				const users = yield* UserRepositoryService;
				yield* users.revokeRoles(id, HashSet.make(role));
			}).pipe(
				Effect.catchTag("UnknownUser", () => HttpApiError.NotFound.make()),
				reportBackendFailure,
			),
		)
		.handle("grantAdminRole", ({ params: { id }, payload: { name } }) =>
			grantGlobalRole(id, name).pipe(
				Effect.catchTag("UnknownUser", () => HttpApiError.NotFound.make()),
				reportBackendFailure,
			),
		)
		.handle("revokeAdminRole", ({ params: { id }, payload: { name } }) =>
			revokeGlobalRole(id, name).pipe(
				Effect.catchTags({
					UnknownUser: () => HttpApiError.NotFound.make(),
					SuperadminInConfig: ({ userId, authentication }) =>
						SuperadminRevokeRefused.make({
							userId,
							authentication,
							message: `Superadmin "${authentication.issuer}:${authentication.subject}" comes from NODECG_SUPERADMINS and can only be revoked by removing the entry there`,
						}),
				}),
				reportBackendFailure,
			),
		),
);

const ServiceAccountsGroupLive = HttpApiBuilder.group(
	RootApi,
	"ServiceAccounts",
	(handlers) =>
		handlers
			.handle("createApiKey", ({ payload: { displayName } }) =>
				Effect.gen(function* () {
					const currentUser = yield* CurrentUser;
					return yield* createServiceAccount(displayName, currentUser.id);
				}).pipe(reportBackendFailure),
			)
			.handle("list", () =>
				Effect.gen(function* () {
					const serviceAccounts = yield* ServiceAccountRepositoryService;
					return { serviceAccounts: yield* serviceAccounts.listAll() };
				}).pipe(reportBackendFailure),
			)
			.handle("delete", ({ params: { id } }) =>
				Effect.gen(function* () {
					const serviceAccounts = yield* ServiceAccountRepositoryService;
					const found = yield* serviceAccounts.delete(id);
					if (!found) {
						return yield* HttpApiError.NotFound.make();
					}
				}).pipe(reportBackendFailure),
			)
			.handle("refresh", ({ params: { id } }) =>
				Effect.gen(function* () {
					const serviceAccounts = yield* ServiceAccountRepositoryService;
					const token = yield* newApiKey();
					const hash = yield* hashApiKey(Redacted.value(token));
					const replaced = yield* serviceAccounts.replaceKey(id, {
						hash,
						label: "",
					});
					if (Option.isNone(replaced)) {
						return yield* HttpApiError.NotFound.make();
					}
					return {
						serviceAccountId: id,
						displayName: replaced.value.displayName,
						token,
					};
				}).pipe(reportBackendFailure),
			)
			.handle("grantRole", ({ params: { id }, payload: role }) =>
				Effect.gen(function* () {
					const { declaredRoles } = yield* NamespaceRegistryService;
					if (!declaredRoles.get(role.namespace)?.has(role.name)) {
						return yield* HttpApiError.UnprocessableEntity.make();
					}
					const serviceAccounts = yield* ServiceAccountRepositoryService;
					yield* serviceAccounts.grantRoles(id, HashSet.make(role));
				}).pipe(
					Effect.catchTag("UnknownServiceAccount", () =>
						HttpApiError.NotFound.make(),
					),
					reportBackendFailure,
				),
			)
			.handle("revokeRole", ({ params: { id }, payload: role }) =>
				Effect.gen(function* () {
					const serviceAccounts = yield* ServiceAccountRepositoryService;
					yield* serviceAccounts.revokeRoles(id, HashSet.make(role));
				}).pipe(
					Effect.catchTag("UnknownServiceAccount", () =>
						HttpApiError.NotFound.make(),
					),
					reportBackendFailure,
				),
			),
);

const RolesGroupLive = HttpApiBuilder.group(RootApi, "Roles", (handlers) =>
	handlers
		.handle("export", () =>
			Effect.gen(function* () {
				const roleRepository = yield* RoleRepositoryService;
				const users = yield* roleRepository.listAll();
				const serviceAccounts = yield* ServiceAccountRepositoryService;
				const serviceAccountList = yield* serviceAccounts.listAll();
				return RoleAssignmentsDocument.make({
					version: 0,
					assignments: [
						...users
							.map(({ authentication, displayName, roles }) =>
								UserDocumentEntry.make({
									authentication,
									displayName,
									roles,
									globalRoles: [],
								}),
							)
							.filter(({ roles }) => roles.length > 0),
						...serviceAccountList
							.map((client) =>
								ServiceAccountDocumentEntry.make({
									id: client.id,
									displayName: client.displayName,
									roles: client.roles,
									globalRoles: [],
								}),
							)
							.filter(({ roles }) => roles.length > 0),
					],
				});
			}).pipe(reportBackendFailure),
		)
		.handle("import", ({ payload: { mode, document } }) =>
			Effect.gen(function* () {
				const authentications = yield* AuthenticationRepositoryService;
				const serviceAccounts = yield* ServiceAccountRepositoryService;

				const users = yield* UserRepositoryService;

				// Admin roles are outside of import and export
				const roleRepository = yield* RoleRepositoryService;
				yield* TransactionService.wrap(
					Effect.gen(function* () {
						if (mode === "replace") {
							yield* roleRepository.revokeAllRoles();
						}

						for (const entry of document.assignments) {
							yield* Match.value(entry).pipe(
								Match.tag("user", ({ authentication, displayName, roles }) =>
									Effect.gen(function* () {
										const { userId } =
											yield* authentications.findOrCreateAuthentication(
												authentication,
												displayName,
											);
										yield* users.grantRoles(
											userId,
											HashSet.fromIterable(roles),
										);
									}),
								),
								Match.tag("serviceAccount", ({ id, displayName, roles }) =>
									Effect.gen(function* () {
										const serviceAccount =
											yield* serviceAccounts.resolveById(id);
										if (Option.isNone(serviceAccount)) {
											const currentUser = yield* CurrentUser;
											yield* serviceAccounts.createWithId({
												id,
												displayName,
												createdBy: currentUser.id,
											});
										}
										yield* serviceAccounts.grantRoles(
											id,
											HashSet.fromIterable(roles),
										);
									}),
								),
								Match.exhaustive,
							);
						}
					}),
				);
			}).pipe(
				Effect.catchTag(["UnknownUser", "UnknownServiceAccount"], (error) =>
					Effect.logError("Backend failed", error).pipe(
						Effect.andThen(HttpApiError.InternalServerError.make()),
					),
				),
				reportBackendFailure,
			),
		),
);

const TelemetryGroupLive = HttpApiBuilder.group(
	RootApi,
	"Telemetry",
	(handlers) =>
		Effect.gen(function* () {
			const status = yield* BrowserTelemetry;
			return handlers.handle("status", () => Effect.succeed(status));
		}),
).pipe(Layer.provide(BrowserTelemetry.layer));

export const InternalGroupsLive = Layer.mergeAll(
	HttpApiBuilder.group(RootApi, "Field", (handlers) =>
		handlers
			.handle("replicantGet", ({ params: { namespace, fieldName } }) =>
				getReplicant(namespace, fieldName).pipe(provideIdentity),
			)
			.handle(
				"replicantUpdate",
				({ params: { namespace, fieldName }, payload }) =>
					updateReplicant(namespace, fieldName, payload).pipe(provideIdentity),
			)
			.handle("computedGet", ({ params: { namespace, fieldName } }) =>
				getComputed(namespace, fieldName).pipe(provideIdentity),
			)
			.handle("topicPublish", ({ params: { namespace, fieldName }, payload }) =>
				publishTopic(namespace, fieldName, payload).pipe(provideIdentity),
			)
			.handle("rpcCall", ({ params: { namespace, fieldName }, payload }) =>
				callRpc(namespace, fieldName, payload).pipe(provideIdentity),
			),
	),
	AuthenticationGroupLive,
	ServiceAccountsGroupLive,
	UsersGroupLive,
	RolesGroupLive,
	TelemetryGroupLive,
);
