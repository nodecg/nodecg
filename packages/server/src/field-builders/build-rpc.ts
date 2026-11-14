import {
	canAccess,
	resolveRpcAccess,
	type RoleRegistry,
	type RpcFieldManifest,
} from "@nodecg/core";
import {
	CurrentIdentity,
	formatField,
	type Identity,
	NamespacePath,
} from "@nodecg/internal";
import { Effect, Schema } from "effect";
import type { Promisable } from "type-fest";

import { fieldInternal } from "./field-internal-key.ts";
import { FieldPermissionDenied } from "./permission.ts";

export class RpcHandlerError extends Schema.TaggedError<RpcHandlerError>()(
	"RpcHandlerError",
	{
		namespace: NamespacePath,
		name: Schema.String,
		cause: Schema.Defect(),
	},
) {
	override readonly message = `RPC handler for ${formatField(this.namespace, this.name)} failed`;
}

export const buildRpc = Effect.fn("buildRpc")(
	<Request, Response, Ctx = unknown>(
		namespace: NamespacePath,
		name: string,
		manifest: RpcFieldManifest<Request, Response>,
		registry: RoleRegistry,
		roleNamespace: string,
		handler: (request: Request, ctx: Ctx) => Promisable<Response>,
		ctx: Ctx,
	) =>
		Effect.sync(() => {
			const access = resolveRpcAccess(registry, manifest.permission);
			const canWrite = (identity: Identity) =>
				canAccess(access.write, identity, roleNamespace, registry);
			const runHandler = (request: Request) =>
				Effect.tryPromise({
					try: async () => handler(request, ctx),
					catch: (error) =>
						RpcHandlerError.make({ namespace, name, cause: error }),
				});

			const call = Effect.fn("call")(function* (request: Request) {
				const identity = yield* CurrentIdentity;
				if (!canWrite(identity)) {
					return yield* FieldPermissionDenied.make({
						namespace,
						name,
						operation: "write",
					});
				}
				return yield* runHandler(request);
			});

			const callEncoded = Effect.fn("callEncoded")(function* (
				payload: Schema.Json,
			) {
				const identity = yield* CurrentIdentity;
				if (!canWrite(identity)) {
					return yield* FieldPermissionDenied.make({
						namespace,
						name,
						operation: "write",
					});
				}
				const request = yield* Effect.fromResult(
					manifest.request.decode(payload),
				);
				const response = yield* runHandler(request);
				return yield* Effect.fromResult(manifest.response.encode(response));
			});

			return {
				call,
				[fieldInternal]: {
					callEncoded,
				},
			};
		}),
);

export type RpcFieldEffect<Request, Response> = Effect.Success<
	ReturnType<typeof buildRpc<Request, Response>>
>;
