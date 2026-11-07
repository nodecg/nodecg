import {
	InternalApi,
	type Role,
	RoleName,
	type LoginProvider,
	UserId,
} from "@nodecg-next/internal";
import { Context, Effect, Layer, ManagedRuntime, Schema } from "effect";
import { FetchHttpClient, Url, UrlParams } from "effect/http";
import { HttpApiClient } from "effect/http-api";

export class AuthRequestFailed extends Schema.TaggedError<AuthRequestFailed>()(
	"AuthRequestFailed",
	{ cause: Schema.Defect() },
) {
	override readonly message = "Authentication request failed";
}

export interface RoleAssignment {
	readonly userId: string;
	readonly role: typeof Role.Encoded;
}

export const loginUrl = (provider: LoginProvider, returnTo?: string) => {
	const params = UrlParams.setAll({ returnTo });
	return Url.modifyUrlParams(provider.url, params).href;
};

export const makeAuthClient = Effect.fn("makeAuthClient")(function* (
	baseUrl?: string,
) {
	const api = yield* HttpApiClient.make(
		InternalApi,
		baseUrl ? { baseUrl } : undefined,
	);

	const requestFailed = (cause: unknown) => new AuthRequestFailed({ cause });

	const providers = Effect.fn("providers")(function* () {
		return yield* api.Authentication.providers().pipe(
			Effect.mapError(requestFailed),
		);
	});

	const me = Effect.fn("me")(function* () {
		return yield* api.Authentication.me().pipe(Effect.mapError(requestFailed));
	});

	const logout = Effect.fn("logout")(function* () {
		yield* api.Authentication.logout().pipe(Effect.mapError(requestFailed));
	});

	const listUsers = Effect.fn("listUsers")(function* () {
		return yield* api.Users.list().pipe(Effect.mapError(requestFailed));
	});

	const grantRole = Effect.fn("grantRole")(function* (
		assignment: RoleAssignment,
	) {
		yield* api.Users.grantRole({
			params: { id: UserId.make(assignment.userId) },
			payload: {
				namespace: assignment.role.namespace,
				name: RoleName.make(assignment.role.name),
			},
		}).pipe(Effect.mapError(requestFailed));
	});

	const revokeRole = Effect.fn("revokeRole")(function* (
		assignment: RoleAssignment,
	) {
		yield* api.Users.revokeRole({
			params: { id: UserId.make(assignment.userId) },
			payload: {
				namespace: assignment.role.namespace,
				name: RoleName.make(assignment.role.name),
			},
		}).pipe(Effect.mapError(requestFailed));
	});

	return { providers, me, logout, listUsers, grantRole, revokeRole };
});

class AuthClientService extends Context.Service<AuthClientService>()(
	"AuthClient",
	{ make: makeAuthClient },
) {
	static readonly layer = (baseUrl?: string) =>
		Layer.effect(this, this.make(baseUrl));
}

export const adaptAuthClient = <R, E>(
	runtime: ManagedRuntime.ManagedRuntime<R, E>,
	client: Effect.Effect<
		Effect.Success<ReturnType<typeof makeAuthClient>>,
		never,
		R
	>,
) => ({
	providers: () =>
		runtime.runPromise(client.pipe(Effect.flatMap((auth) => auth.providers()))),
	me: () =>
		runtime.runPromise(client.pipe(Effect.flatMap((auth) => auth.me()))),
	logout: () =>
		runtime.runPromise(client.pipe(Effect.flatMap((auth) => auth.logout()))),
	listUsers: () =>
		runtime.runPromise(client.pipe(Effect.flatMap((auth) => auth.listUsers()))),
	grantRole: (assignment: RoleAssignment) =>
		runtime.runPromise(
			client.pipe(Effect.flatMap((auth) => auth.grantRole(assignment))),
		),
	revokeRole: (assignment: RoleAssignment) =>
		runtime.runPromise(
			client.pipe(Effect.flatMap((auth) => auth.revokeRole(assignment))),
		),
});

export function loadAuthClient(baseUrl?: string) {
	const runtime = ManagedRuntime.make(
		AuthClientService.layer(baseUrl).pipe(Layer.provide(FetchHttpClient.layer)),
	);

	return {
		...adaptAuthClient(runtime, AuthClientService),
		dispose: () => void runtime.dispose(),
	};
}

export type AuthClient = ReturnType<typeof loadAuthClient>;
