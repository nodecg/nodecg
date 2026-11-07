import { Context, type Option } from "effect";
import {
	HttpApiError,
	HttpApiMiddleware,
	HttpApiSecurity,
} from "effect/http-api";

import type { Identity } from "./models/identity.ts";
import type { ServiceAccount } from "./models/service-account.ts";
import type { User } from "./models/user.ts";

export class CurrentIdentity extends Context.Service<
	CurrentIdentity,
	Identity
>()("CurrentIdentity") {}

export class CurrentUser extends Context.Service<CurrentUser, User>()(
	"CurrentUser",
) {}

export class CurrentSessionUser extends Context.Service<
	CurrentSessionUser,
	Option.Option<User>
>()("CurrentSessionUser") {}

export class CurrentServiceAccount extends Context.Service<
	CurrentServiceAccount,
	ServiceAccount
>()("CurrentServiceAccount") {}

export const sessionCookieName = "nodecg.sid";

export const sessionCookieSecurity = HttpApiSecurity.apiKey({
	key: sessionCookieName,
	in: "cookie",
});

export class UserAuthenticationMiddleware extends HttpApiMiddleware.Service<
	UserAuthenticationMiddleware,
	{ provides: CurrentSessionUser }
>()("Authentication", {
	error: [HttpApiError.Unauthorized, HttpApiError.InternalServerError],
	security: { cookie: sessionCookieSecurity },
}) {}

export class AdminTierMiddleware extends HttpApiMiddleware.Service<
	AdminTierMiddleware,
	{ requires: CurrentSessionUser; provides: CurrentUser }
>()("AdminTier", {
	error: [HttpApiError.Unauthorized, HttpApiError.Forbidden],
}) {}

export class SuperadminMiddleware extends HttpApiMiddleware.Service<
	SuperadminMiddleware,
	{ requires: CurrentSessionUser; provides: CurrentUser }
>()("Superadmin", {
	error: [HttpApiError.Unauthorized, HttpApiError.Forbidden],
}) {}

export class ServiceAccountAuthenticationMiddleware extends HttpApiMiddleware.Service<
	ServiceAccountAuthenticationMiddleware,
	{ provides: CurrentServiceAccount }
>()("ServiceAccountAuthentication", {
	error: [HttpApiError.Unauthorized, HttpApiError.InternalServerError],
	security: { bearer: HttpApiSecurity.bearer },
}) {}
