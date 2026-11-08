import { isAdminTier, isSuperadmin } from "@nodecg/core";
import {
	AdminTierMiddleware,
	CurrentServiceAccount,
	CurrentSessionUser,
	CurrentUser,
	UserAuthenticationMiddleware,
	ServiceAccountAuthenticationMiddleware,
	SuperadminMiddleware,
} from "@nodecg/internal";
import { Effect, Layer, Option, Redacted } from "effect";
import type { Digest } from "effect/crypto";
import { HttpApiError } from "effect/http-api";

import { ConfiguredSuperadmins } from "../configured-superadmins.ts";
import { config } from "../server-config.ts";
import { ServiceAccountRepositoryService } from "../services/repository/service-account/service-account-repository.ts";
import { SessionRepositoryService } from "../services/repository/session/session-repository.ts";
import {
	resolveServiceAccountCaller,
	resolveSessionCaller,
} from "./identity.ts";
import { RoleLinks } from "./role-links.ts";
import { renewSession, setSessionCookie } from "./session.ts";

export const UserAuthenticationMiddlewareLive = Layer.effect(
	UserAuthenticationMiddleware,
	Effect.gen(function* () {
		const requireAuth = yield* config.requireAuth;
		const baseUrl = yield* config.baseUrl;
		const sessionTtl = yield* config.sessionTtl;
		const context = yield* Effect.context<
			| SessionRepositoryService
			| ConfiguredSuperadmins
			| RoleLinks
			| Digest.Digest
		>();

		return {
			cookie: (httpEffect, { credential }) =>
				Effect.gen(function* () {
					const value = Redacted.value(credential);
					const caller = yield* resolveSessionCaller(value).pipe(
						Effect.provide(context),
						Effect.tapCause((cause) =>
							Effect.logError("Session lookup failed", cause),
						),
						Effect.catchTag("BackendError", () =>
							HttpApiError.InternalServerError.make(),
						),
					);
					if (Option.isNone(caller) && requireAuth) {
						return yield* HttpApiError.Unauthorized.make();
					}
					if (Option.isSome(caller)) {
						const isRenewed = yield* renewSession(value).pipe(
							Effect.provide(context),
							Effect.tapCause((cause) =>
								Effect.logError("Session renewal failed", cause),
							),
							Effect.catchTag(["BackendError", "ConfigError"], () =>
								HttpApiError.InternalServerError.make(),
							),
						);
						if (isRenewed) {
							yield* setSessionCookie(value, {
								path: baseUrl.pathname,
								maxAge: sessionTtl,
							});
						}
					}
					return yield* httpEffect.pipe(
						Effect.provideService(CurrentSessionUser, caller),
					);
				}),
		};
	}),
);

export const AdminTierMiddlewareLive = Layer.succeed(
	AdminTierMiddleware,
	(httpEffect) =>
		Effect.gen(function* () {
			const caller = yield* CurrentSessionUser;
			if (Option.isNone(caller)) {
				return yield* HttpApiError.Unauthorized.make();
			}
			if (!isAdminTier(caller.value)) {
				return yield* HttpApiError.Forbidden.make();
			}
			return yield* httpEffect.pipe(
				Effect.provideService(CurrentUser, caller.value),
			);
		}),
);

export const SuperadminMiddlewareLive = Layer.succeed(
	SuperadminMiddleware,
	(httpEffect) =>
		Effect.gen(function* () {
			const caller = yield* CurrentSessionUser;
			if (Option.isNone(caller)) {
				return yield* HttpApiError.Unauthorized.make();
			}
			if (!isSuperadmin(caller.value)) {
				return yield* HttpApiError.Forbidden.make();
			}
			return yield* httpEffect.pipe(
				Effect.provideService(CurrentUser, caller.value),
			);
		}),
);

export const ServiceAccountAuthenticationMiddlewareLive = Layer.effect(
	ServiceAccountAuthenticationMiddleware,
	Effect.gen(function* () {
		const context = yield* Effect.context<
			ServiceAccountRepositoryService | RoleLinks | Digest.Digest
		>();

		return {
			bearer: (httpEffect, { credential }) =>
				Effect.gen(function* () {
					const value = Redacted.value(credential);
					const caller = yield* resolveServiceAccountCaller(value).pipe(
						Effect.provide(context),
						Effect.tapCause((cause) =>
							Effect.logError("API key lookup failed", cause),
						),
						Effect.catchTag("BackendError", () =>
							HttpApiError.InternalServerError.make(),
						),
					);
					if (Option.isNone(caller)) {
						return yield* HttpApiError.Unauthorized.make();
					}
					return yield* httpEffect.pipe(
						Effect.provideService(CurrentServiceAccount, caller.value),
					);
				}),
		};
	}),
);
