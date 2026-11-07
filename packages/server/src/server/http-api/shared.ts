import { RpcCallError } from "@nodecg-next/internal";
import type { Patch } from "@nodecg-next/internal/occ";
import { Effect, Match, type Schema } from "effect";
import { HttpApiError } from "effect/http-api";

import { NamespaceRegistryService } from "../../namespace-registry.ts";

export const getReplicant = (namespace: string, name: string) =>
	Effect.gen(function* () {
		const registry = yield* NamespaceRegistryService;
		const field = registry.replicant.get(namespace)?.get(name);
		if (typeof field === "undefined") {
			return yield* new HttpApiError.NotFound();
		}
		return yield* field.getRevisioned().pipe(
			Effect.map((revisioned) => revisioned.value),
			Effect.catchTags({
				FieldPermissionDenied: () => new HttpApiError.Forbidden(),
			}),
		);
	});

export const updateReplicant = (
	namespace: string,
	name: string,
	payload: Patch,
) =>
	Effect.gen(function* () {
		const registry = yield* NamespaceRegistryService;
		const field = registry.replicant.get(namespace)?.get(name);
		if (typeof field === "undefined") {
			return yield* new HttpApiError.NotFound();
		}
		yield* field.commitPatch(payload).pipe(
			Effect.mapError((error) =>
				Match.value(error).pipe(
					Match.tag("PatchNotApplicable", (invalid) => invalid),
					Match.tag("RevisionConflict", (conflict) => conflict),
					Match.tag(
						"FieldPermissionDenied",
						() => new HttpApiError.Forbidden(),
					),
					Match.tag("FieldDecodeError", () => new HttpApiError.BadRequest()),
					Match.tag("UnknownReplicant", () => new HttpApiError.NotFound()),
					Match.exhaustive,
				),
			),
		);
	});

export const getComputed = (namespace: string, name: string) =>
	Effect.gen(function* () {
		const registry = yield* NamespaceRegistryService;
		const field = registry.computed.get(namespace)?.get(name);
		if (typeof field === "undefined") {
			return yield* new HttpApiError.NotFound();
		}
		return yield* field.getEncoded().pipe(
			Effect.catchTags({
				FieldPermissionDenied: () => new HttpApiError.Forbidden(),
				ComputedComputeError: () => new HttpApiError.InternalServerError(),
				FieldEncodeError: () => new HttpApiError.InternalServerError(),
			}),
		);
	});

export const publishTopic = (
	namespace: string,
	name: string,
	payload: Schema.Json,
) =>
	Effect.gen(function* () {
		const registry = yield* NamespaceRegistryService;
		const field = registry.topic.get(namespace)?.get(name);
		if (typeof field === "undefined") {
			return yield* new HttpApiError.NotFound();
		}
		yield* field.publishEncoded(payload).pipe(
			Effect.catchTags({
				FieldPermissionDenied: () => new HttpApiError.Forbidden(),
				FieldDecodeError: () => new HttpApiError.BadRequest(),
			}),
		);
	});

export const callRpc = (
	namespace: string,
	name: string,
	payload: Schema.Json,
) =>
	Effect.gen(function* () {
		const registry = yield* NamespaceRegistryService;
		const field = registry.rpc.get(namespace)?.get(name);
		if (typeof field === "undefined") {
			return yield* new HttpApiError.NotFound();
		}
		return yield* field.callEncoded(payload).pipe(
			Effect.catchTags({
				FieldPermissionDenied: () => new HttpApiError.Forbidden(),
				FieldDecodeError: () => new HttpApiError.BadRequest(),
				RpcHandlerError: (error) =>
					new RpcCallError({ message: error.message }),
				FieldEncodeError: (error) =>
					new RpcCallError({ message: error.message }),
			}),
		);
	});
