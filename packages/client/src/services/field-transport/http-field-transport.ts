import { InternalApi } from "@nodecg-next/internal";
import type { Patch } from "@nodecg-next/internal/occ";
import { toError } from "@nodecg-next/internal/utils";
import { Effect, Layer, Match, type Schema } from "effect";
import { FetchHttpClient } from "effect/http";
import { HttpApiClient } from "effect/http-api";

import {
	RpcCallError,
	FieldGetError,
	FieldNotFound,
	FieldPermissionDenied,
	FieldSetError,
	FieldTransportService,
	TopicPublishError,
} from "../field-transport/field-transport.ts";

export const httpFieldTransport = (baseUrl?: string) =>
	Layer.effect(
		FieldTransportService,
		Effect.gen(function* () {
			const client = yield* HttpApiClient.make(InternalApi, { baseUrl });

			const getReplicant = Effect.fn("FieldTransport.getReplicant")(function* (
				namespace: string,
				name: string,
			) {
				return yield* client.Field.replicantGet({
					params: { namespace, fieldName: name },
				}).pipe(
					Effect.mapError((error) =>
						Match.value(error).pipe(
							Match.tag(
								"NotFound",
								() => new FieldNotFound({ namespace, name }),
							),
							Match.tag(
								"Forbidden",
								() => new FieldPermissionDenied({ namespace, name }),
							),
							Match.orElse(
								(e) =>
									new FieldGetError({ namespace, name, cause: toError(e) }),
							),
						),
					),
				);
			});

			const getComputed = Effect.fn("FieldTransport.getComputed")(function* (
				namespace: string,
				name: string,
			) {
				return yield* client.Field.computedGet({
					params: { namespace, fieldName: name },
				}).pipe(
					Effect.mapError((error) =>
						Match.value(error).pipe(
							Match.tag(
								"NotFound",
								() => new FieldNotFound({ namespace, name }),
							),
							Match.tag(
								"Forbidden",
								() => new FieldPermissionDenied({ namespace, name }),
							),
							Match.orElse(
								(e) =>
									new FieldGetError({ namespace, name, cause: toError(e) }),
							),
						),
					),
				);
			});

			const updateReplicant = Effect.fn("FieldTransport.updateReplicant")(
				function* (namespace: string, name: string, patch: Patch) {
					yield* client.Field.replicantUpdate({
						params: { namespace, fieldName: name },
						payload: patch,
					}).pipe(
						Effect.mapError((error) =>
							Match.value(error).pipe(
								Match.tag(
									"NotFound",
									() => new FieldNotFound({ namespace, name }),
								),
								Match.tag(
									"Forbidden",
									() => new FieldPermissionDenied({ namespace, name }),
								),
								Match.tag("RevisionConflict", (conflict) => conflict),
								Match.orElse(
									(e) =>
										new FieldSetError({ namespace, name, cause: toError(e) }),
								),
							),
						),
					);
				},
			);

			const publishTopic = Effect.fn("FieldTransport.publishTopic")(function* (
				namespace: string,
				name: string,
				value: Schema.Json,
			) {
				yield* client.Field.topicPublish({
					params: { namespace, fieldName: name },
					payload: value,
				}).pipe(
					Effect.mapError((error) =>
						Match.value(error).pipe(
							Match.tag(
								"NotFound",
								() => new FieldNotFound({ namespace, name }),
							),
							Match.tag(
								"Forbidden",
								() => new FieldPermissionDenied({ namespace, name }),
							),
							Match.orElse(
								(e) =>
									new TopicPublishError({
										namespace,
										name,
										cause: toError(e),
									}),
							),
						),
					),
				);
			});

			const callRpc = Effect.fn("FieldTransport.callRpc")(function* (
				namespace: string,
				name: string,
				request: Schema.Json,
			) {
				return yield* client.Field.rpcCall({
					params: { namespace, fieldName: name },
					payload: request,
				}).pipe(
					Effect.mapError((error) =>
						Match.value(error).pipe(
							Match.tag(
								"NotFound",
								() => new FieldNotFound({ namespace, name }),
							),
							Match.tag(
								"Forbidden",
								() => new FieldPermissionDenied({ namespace, name }),
							),
							Match.orElse(
								(e) => new RpcCallError({ namespace, name, cause: toError(e) }),
							),
						),
					),
				);
			});

			return {
				getReplicant,
				getComputed,
				updateReplicant,
				publishTopic,
				callRpc,
			};
		}),
	).pipe(Layer.provide(FetchHttpClient.layer));
