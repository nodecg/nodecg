import type {
	InferNamespace,
	WidestCustomRoutes,
	WidestNamespaceFields,
} from "@nodecg/core";
import { CurrentIdentity, ServerIdentity } from "@nodecg/internal";
import {
	type ApplyLambdaToObjectValues,
	mapValues,
} from "@nodecg/internal/utils";
import {
	Effect,
	Exit,
	type HKT,
	Option,
	Result,
	Schema,
	Scope,
	Stream,
} from "effect";
import type { Promisable } from "type-fest";

import {
	type BuiltNamespace,
	buildFields,
	type FieldServices,
	makeCrossNamespaceHandle,
} from "./build-fields.ts";
import { fieldInternal } from "./field-builders/field-internal-key.ts";
import type {
	ComputedFieldEffectLambda,
	ComputedFieldLambda,
	ReplicantFieldEffectLambda,
	ReplicantFieldLambda,
	RpcFieldEffectLambda,
	RpcFieldLambda,
	TopicFieldEffectLambda,
	TopicFieldLambda,
} from "./field-lambdas.ts";
import type {
	ComputeContext,
	CrossNamespaceHandle,
	ImplementedNamespace,
	LoadedNamespace,
} from "./implement-namespace.ts";
import type { ReplicantStoreService } from "./replicant-store.ts";
import type { TopicBrokerService } from "./services/topic-broker/topic-broker.ts";

const serverIdentity = ServerIdentity.make({});

const asServer = Effect.provideService(CurrentIdentity, serverIdentity);

export class MissingReplicantSeed extends Schema.TaggedError<MissingReplicantSeed>()(
	"MissingReplicantSeed",
	{ namespace: Schema.String, name: Schema.String },
) {
	override readonly message = `Missing seed value for replicant "${this.name}" in "${this.namespace}"`;
}

export interface NamespaceHandles<S extends WidestNamespaceFields> {
	readonly compute: ComputeContext<
		S["replicant"],
		S["computed"],
		S["children"]
	>;
	readonly rpc: CrossNamespaceHandle<S>;
	readonly loaded: LoadedNamespace<S>;
}

export interface NamespaceHandlesLambda extends HKT.TypeLambda {
	readonly type: NamespaceHandles<InferNamespace<this["Target"]>["fields"]>;
}

interface ComputeContextLambda extends HKT.TypeLambda {
	readonly type: ComputeContext<
		InferNamespace<this["Target"]>["fields"]["replicant"],
		InferNamespace<this["Target"]>["fields"]["computed"],
		InferNamespace<this["Target"]>["fields"]["children"]
	>;
}

interface CrossNamespaceHandleLambda extends HKT.TypeLambda {
	readonly type: CrossNamespaceHandle<InferNamespace<this["Target"]>["fields"]>;
}

interface LoadedNamespaceLambda extends HKT.TypeLambda {
	readonly type: LoadedNamespace<InferNamespace<this["Target"]>["fields"]>;
}

export const buildNamespace = Effect.fn("buildNamespace")(function* <
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
>(
	implemented: ImplementedNamespace<S, CustomRoutes>,
	children: ApplyLambdaToObjectValues<NamespaceHandlesLambda, S["children"]>,
) {
	const { manifest, impl } = implemented;
	const seedReplicant = impl?.seedReplicant;

	for (const name of Object.keys(manifest.replicant)) {
		if (typeof seedReplicant?.[name] === "undefined") {
			return yield* MissingReplicantSeed.make({
				namespace: manifest.namespace,
				name,
			});
		}
	}

	const compute = mapValues<NamespaceHandlesLambda, ComputeContextLambda>(
		(child) => child.compute,
	)(children);
	const rpc = mapValues<NamespaceHandlesLambda, CrossNamespaceHandleLambda>(
		(child) => child.rpc,
	)(children);
	const loaded = mapValues<NamespaceHandlesLambda, LoadedNamespaceLambda>(
		(child) => child.loaded,
	)(children);

	const { fields, computeContext, fieldServices } = yield* buildFields(
		manifest,
		impl,
		{ compute, rpc },
	);
	const handles: NamespaceHandles<S> = {
		compute: computeContext,
		rpc: makeCrossNamespaceHandle(fieldServices, fields, rpc),
		loaded: adaptNamespace(fieldServices, fields, loaded),
	};
	return { fields, handles };
});

const adaptNamespace = <S extends WidestNamespaceFields>(
	services: FieldServices,
	built: BuiltNamespace<S>,
	children: LoadedNamespace<S>["children"],
) => {
	const runPromise = Effect.runPromiseWith(services);

	const subscribeAdapter =
		<Decoded, E>(
			subscribe: () => Effect.Effect<
				Stream.Stream<
					Decoded,
					never,
					TopicBrokerService | ReplicantStoreService
				>,
				E,
				TopicBrokerService | ReplicantStoreService | Scope.Scope
			>,
			name: string,
		) =>
		async (handler: (value: Decoded) => Promisable<void>) =>
			runPromise(
				Effect.gen(function* () {
					const scope = yield* Scope.make();
					const subscription = yield* subscribe().pipe(Scope.provide(scope));
					yield* Effect.forkIn(
						Stream.runForEach(subscription, (value) =>
							Effect.tryPromise(async () => handler(value)).pipe(
								Effect.catchTag("UnknownError", (error) =>
									Effect.logError(
										`Subscription handler for "${built.namespace}/${name}" threw`,
										error,
									),
								),
							),
						).pipe(Effect.satisfiesErrorType<never>()),
						scope,
					);
					return async () => {
						await runPromise(Scope.close(scope, Exit.void));
					};
				}),
			);

	const loaded: LoadedNamespace<S> = {
		replicant: mapValues<ReplicantFieldEffectLambda, ReplicantFieldLambda>(
			(field, name) => ({
				get: () =>
					Result.getOrThrow(field[fieldInternal].getResult(serverIdentity)),
				set: (value) => runPromise(field.set(value).pipe(asServer)),
				update: (fn) => runPromise(field.update(fn).pipe(asServer)),
				validate: (value) => runPromise(field.validate(value)),
				subscribe: (handler) =>
					subscribeAdapter(
						() => field.subscribe().pipe(Effect.map(Stream.zipWithPrevious)),
						name,
					)(([oldValue, value]) =>
						handler(value, Option.getOrUndefined(oldValue)),
					),
			}),
		)(built.replicant),
		computed: mapValues<ComputedFieldEffectLambda, ComputedFieldLambda>(
			(field, name) => ({
				get: () =>
					Result.getOrThrow(field[fieldInternal].getResult(serverIdentity)),
				subscribe: (handler) =>
					subscribeAdapter(
						() => field.subscribe().pipe(Effect.map(Stream.zipWithPrevious)),
						name,
					)(([oldValue, value]) =>
						handler(value, Option.getOrUndefined(oldValue)),
					),
			}),
		)(built.computed),
		topic: mapValues<TopicFieldEffectLambda, TopicFieldLambda>(
			(field, name) => ({
				publish: (value) => runPromise(field.publish(value).pipe(asServer)),
				subscribe: subscribeAdapter(field.subscribe, name),
			}),
		)(built.topic),
		rpc: mapValues<RpcFieldEffectLambda, RpcFieldLambda>(
			(field) => (request) => runPromise(field.call(request).pipe(asServer)),
		)(built.rpc),
		children,
	};
	return loaded;
};
