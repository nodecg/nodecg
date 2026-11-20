import { type NamespacePath, RpcCallError } from "@nodecg/internal";
import type { Patch } from "@nodecg/internal/occ";
import { Effect, HashMap, Match, Option, Record, type Schema } from "effect";
import { HttpApiError } from "effect/http-api";

import { fieldInternal } from "../../field-builders/field-internal-key.ts";
import { NamespaceRegistryService } from "../../namespace-registry.ts";

export const getReplicant = (namespace: NamespacePath, name: string) =>
	Effect.gen(function* () {
		const registry = yield* NamespaceRegistryService;
		const field = registry.pipe(
			HashMap.get(namespace),
			Option.flatMap(({ fields }) => Record.get(fields.replicant, name)),
		);
		if (Option.isNone(field)) {
			return yield* new HttpApiError.NotFound();
		}
		return yield* field.value[fieldInternal].getRevisioned().pipe(
			Effect.map((revisioned) => revisioned.value),
			Effect.catchTags({
				FieldPermissionDenied: () => new HttpApiError.Forbidden(),
			}),
		);
	});

export const updateReplicant = (
	namespace: NamespacePath,
	name: string,
	payload: Patch,
) =>
	Effect.gen(function* () {
		const registry = yield* NamespaceRegistryService;
		const field = registry.pipe(
			HashMap.get(namespace),
			Option.flatMap(({ fields }) => Record.get(fields.replicant, name)),
		);
		if (Option.isNone(field)) {
			return yield* new HttpApiError.NotFound();
		}
		yield* field.value[fieldInternal].commitPatch(payload).pipe(
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

export const getComputed = (namespace: NamespacePath, name: string) =>
	Effect.gen(function* () {
		const registry = yield* NamespaceRegistryService;
		const field = registry.pipe(
			HashMap.get(namespace),
			Option.flatMap(({ fields }) => Record.get(fields.computed, name)),
		);
		if (Option.isNone(field)) {
			return yield* new HttpApiError.NotFound();
		}
		return yield* field.value[fieldInternal].getEncoded().pipe(
			Effect.catchTags({
				FieldPermissionDenied: () => HttpApiError.Forbidden.make(),
				ComputedComputeError: () => HttpApiError.InternalServerError.make(),
				ComputedCycle: () => HttpApiError.InternalServerError.make(),
				FieldEncodeError: () => HttpApiError.InternalServerError.make(),
				FieldDecodeError: () => HttpApiError.InternalServerError.make(),
			}),
		);
	});

export const publishTopic = (
	namespace: NamespacePath,
	name: string,
	payload: Schema.Json,
) =>
	Effect.gen(function* () {
		const registry = yield* NamespaceRegistryService;
		const field = registry.pipe(
			HashMap.get(namespace),
			Option.flatMap(({ fields }) => Record.get(fields.topic, name)),
		);
		if (Option.isNone(field)) {
			return yield* new HttpApiError.NotFound();
		}
		yield* field.value[fieldInternal].publishEncoded(payload).pipe(
			Effect.catchTags({
				FieldPermissionDenied: () => new HttpApiError.Forbidden(),
				FieldDecodeError: () => new HttpApiError.BadRequest(),
			}),
		);
	});

export const callRpc = (
	namespace: NamespacePath,
	name: string,
	payload: Schema.Json,
) =>
	Effect.gen(function* () {
		const registry = yield* NamespaceRegistryService;
		const field = registry.pipe(
			HashMap.get(namespace),
			Option.flatMap(({ fields }) => Record.get(fields.rpc, name)),
		);
		if (Option.isNone(field)) {
			return yield* new HttpApiError.NotFound();
		}
		return yield* field.value[fieldInternal].callEncoded(payload).pipe(
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
