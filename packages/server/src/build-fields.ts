import type { WidestNamespaceFields, NamespaceManifest } from "@nodecg/core";
import {
	CurrentIdentity,
	type NamespacePath,
	ServerIdentity,
} from "@nodecg/internal";
import {
	mapValues,
	mapEffectValues,
	zipEffectValues,
} from "@nodecg/internal/utils";
import { Context, Data, Effect, Result, Tracer } from "effect";

import {
	buildComputed,
	type ComputedFieldEffect,
} from "./field-builders/build-computed.ts";
import {
	buildReplicant,
	type ReplicantFieldEffect,
} from "./field-builders/build-replicant.ts";
import { buildRpc } from "./field-builders/build-rpc.ts";
import {
	buildTopic,
	type TopicFieldEffect,
} from "./field-builders/build-topic.ts";
import { fieldInternal } from "./field-builders/field-internal-key.ts";
import type {
	ComputedFieldEffectLambda,
	ComputeFnLambda,
	FieldReadLambda,
	FieldManifestLambda,
	ReplicantFieldEffectLambda,
	ReplicantFieldManifestLambda,
	RpcComputedAccessorLambda,
	RpcFieldEffectLambda,
	RpcFieldLambda,
	RpcFieldManifestLambda,
	RpcHandlerLambda,
	RpcReplicantAccessorLambda,
	RpcTopicAccessorLambda,
	SeedFnLambda,
	TopicFieldEffectLambda,
} from "./field-lambdas.ts";
import type {
	ComputeContext,
	CrossNamespaceHandle,
	NamespaceOptions,
	RpcContext,
} from "./implement-namespace.ts";
import {
	ComputedComputeError,
	type ComputeFailure,
	type ReplicantStoreService,
} from "./replicant-store.ts";
import type { TopicBrokerService } from "./services/topic-broker/topic-broker.ts";

const serverIdentity = ServerIdentity.make({});

class FieldReadError extends Data.TaggedError("FieldReadError")<{
	readonly failure: ComputeFailure;
}> {}

const asServer = Effect.provideService(CurrentIdentity, serverIdentity);

export type FieldServices = TopicBrokerService | ReplicantStoreService;

// TODO: use Effect's R instead of Context
const fieldAccessors =
	(services: Context.Context<FieldServices>) =>
	<
		Replicant extends Record<string, unknown>,
		Computed extends Record<string, unknown>,
		Topic extends Record<string, unknown>,
	>(fields: {
		readonly replicant: {
			readonly [K in keyof Replicant & string]: ReplicantFieldEffect<
				Replicant[K]
			>;
		};
		readonly computed: {
			readonly [K in keyof Computed & string]: ComputedFieldEffect<Computed[K]>;
		};
		readonly topic: {
			readonly [K in keyof Topic & string]: TopicFieldEffect<Topic[K]>;
		};
	}) => {
		const runPromise = Effect.runPromiseWith(services);
		return {
			replicant: mapValues<
				ReplicantFieldEffectLambda,
				RpcReplicantAccessorLambda
			>((field) => ({
				get: () =>
					Result.getOrThrow(field[fieldInternal].getResult(serverIdentity)),
				set: (value) => runPromise(field.set(value).pipe(asServer)),
				update: (fn) => runPromise(field.update(fn).pipe(asServer)),
			}))(fields.replicant),
			computed: mapValues<ComputedFieldEffectLambda, RpcComputedAccessorLambda>(
				(field) => ({
					get: () =>
						Result.getOrThrow(field[fieldInternal].getResult(serverIdentity)),
				}),
			)(fields.computed),
			topic: mapValues<TopicFieldEffectLambda, RpcTopicAccessorLambda>(
				(field) => ({
					publish: (value) => runPromise(field.publish(value).pipe(asServer)),
				}),
			)(fields.topic),
		};
	};

export const makeCrossNamespaceHandle = <S extends WidestNamespaceFields>(
	services: Context.Context<FieldServices>,
	fields: BuiltNamespace<S>,
	children: CrossNamespaceHandle<S>["children"],
): CrossNamespaceHandle<S> => ({
	...fieldAccessors(services)(fields),
	rpc: mapValues<RpcFieldEffectLambda, RpcFieldLambda>(
		(field) => (request) =>
			Effect.runPromiseWith(services)(field.call(request).pipe(asServer)),
	)(fields.rpc),
	children,
});

export const buildFields = Effect.fn("buildFields")(function* <
	S extends WidestNamespaceFields,
>(
	namespace: NamespacePath,
	manifest: NamespaceManifest<string, S, string>,
	options: NamespaceOptions<S> | undefined,
	children: {
		readonly compute: ComputeContext<
			S["replicant"],
			S["computed"],
			S["children"]
		>["children"];
		readonly rpc: RpcContext<S>["children"];
	},
) {
	const seedReplicantFns = options?.seedReplicant;
	const computeFns = options?.implementComputed;
	const rpcHandlers = options?.implementRpc;

	const fieldServices = yield* Effect.context<FieldServices>().pipe(
		Effect.map(Context.omit(Tracer.ParentSpan)),
	);

	const replicant = yield* zipEffectValues<
		ReplicantFieldManifestLambda,
		SeedFnLambda,
		ReplicantFieldEffectLambda,
		unknown,
		S["replicant"]
	>()(manifest.replicant, seedReplicantFns, (codec, seed, name) =>
		buildReplicant(namespace, name, codec, seed()),
	);

	type OwnComputeContext = ComputeContext<
		S["replicant"],
		S["computed"],
		S["children"]
	>;

	let ownComputedAccessors: OwnComputeContext["computed"] | undefined;
	const computeContext: OwnComputeContext = {
		replicant: mapValues<ReplicantFieldEffectLambda, FieldReadLambda>(
			(field) => ({
				get: () =>
					field[fieldInternal].getResult(serverIdentity).pipe(
						Result.getOrElse((failure) => {
							throw new FieldReadError({ failure });
						}),
					),
			}),
		)(replicant),
		get computed() {
			if (typeof ownComputedAccessors === "undefined") {
				throw new Error(
					"computed accessors are not available while the namespace is being built",
				);
			}
			return ownComputedAccessors;
		},
		children: children.compute,
	};

	const computed = yield* zipEffectValues<
		FieldManifestLambda,
		ComputeFnLambda,
		ComputedFieldEffectLambda,
		OwnComputeContext,
		S["computed"]
	>()(manifest.computed, computeFns, (codec, compute, name) =>
		buildComputed(namespace, name, codec, () =>
			Result.try({
				try: () => compute(computeContext),
				catch: (error) =>
					error instanceof FieldReadError
						? error.failure
						: ComputedComputeError.make({ namespace, name, cause: error }),
			}),
		),
	);

	ownComputedAccessors = mapValues<ComputedFieldEffectLambda, FieldReadLambda>(
		(field) => ({
			get: () =>
				field[fieldInternal].getResult(serverIdentity).pipe(
					Result.getOrElse((failure) => {
						throw new FieldReadError({ failure });
					}),
				),
		}),
	)(computed);

	const topic = yield* mapEffectValues<
		FieldManifestLambda,
		TopicFieldEffectLambda
	>()((codec, name) => buildTopic(namespace, name, codec))(manifest.topic);

	const rpcContext: RpcContext<S> = {
		...fieldAccessors(fieldServices)({ replicant, computed, topic }),
		children: children.rpc,
	};

	const rpc = yield* zipEffectValues<
		RpcFieldManifestLambda,
		RpcHandlerLambda,
		RpcFieldEffectLambda,
		RpcContext<S>,
		S["rpc"]
	>()(manifest.rpc, rpcHandlers, (codec, handler, name) =>
		buildRpc(namespace, name, codec, handler, rpcContext),
	);

	return {
		fields: { namespace: manifest.namespace, replicant, computed, topic, rpc },
		computeContext,
		fieldServices,
	};
});

type BuiltFields<S extends WidestNamespaceFields> = Effect.Success<
	ReturnType<typeof buildFields<S>>
>["fields"];

export interface BuiltNamespace<
	S extends WidestNamespaceFields = WidestNamespaceFields,
> extends BuiltFields<S> {}
