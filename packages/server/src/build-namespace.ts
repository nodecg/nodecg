import type {
	InferNamespace,
	WidestCustomRoutes,
	WidestNamespaceFields,
} from "@nodecg/core";
import {
	CurrentIdentity,
	formatField,
	NamespacePath,
	ServerIdentity,
} from "@nodecg/internal";
import {
	type ApplyLambdaToObjectValues,
	mapValues,
} from "@nodecg/internal/utils";
import {
	Cause,
	Context,
	Effect,
	Exit,
	Fiber,
	FiberSet,
	type HKT,
	Option,
	Result,
	Schema,
	Scope,
	Stream,
	Tracer,
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

const serverIdentity = ServerIdentity.make({});

const asServer = Effect.provideService(CurrentIdentity, serverIdentity);

export class MissingReplicantSeed extends Schema.TaggedError<MissingReplicantSeed>()(
	"MissingReplicantSeed",
	{ namespace: NamespacePath, name: Schema.String },
) {
	override readonly message = `Missing seed value for replicant ${formatField(this.namespace, this.name)}`;
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
	namespace: NamespacePath,
	implemented: ImplementedNamespace<S, CustomRoutes>,
	children: ApplyLambdaToObjectValues<NamespaceHandlesLambda, S["children"]>,
) {
	const { manifest, impl } = implemented;
	const seedReplicant = impl?.seedReplicant;

	for (const name of Object.keys(manifest.replicant)) {
		if (typeof seedReplicant?.[name] === "undefined") {
			return yield* MissingReplicantSeed.make({ namespace, name });
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
		namespace,
		manifest,
		impl,
		{ compute, rpc },
	);
	const runSubscription = yield* FiberSet.makeRuntime<FieldServices>().pipe(
		Effect.updateContext<
			FieldServices | Scope.Scope,
			FieldServices | Scope.Scope
		>(Context.omit(Tracer.ParentSpan)),
	);
	const handles: NamespaceHandles<S> = {
		compute: computeContext,
		rpc: makeCrossNamespaceHandle(fieldServices, fields, rpc),
		loaded: adaptNamespace(
			namespace,
			fieldServices,
			runSubscription,
			fields,
			loaded,
		),
	};
	return { fields, handles };
});

const adaptNamespace = <S extends WidestNamespaceFields>(
	namespace: NamespacePath,
	services: Context.Context<FieldServices>,
	runSubscription: <E>(
		subscription: Effect.Effect<void, E, FieldServices>,
	) => Fiber.Fiber<void, E>,
	built: BuiltNamespace<S>,
	children: LoadedNamespace<S>["children"],
) => {
	const runPromise = Effect.runPromiseWith(services);
	const runFork = Effect.runForkWith(services);

	const subscribeAdapter =
		<Decoded, E>(
			subscribe: () => Effect.Effect<
				Stream.Stream<Decoded, never, FieldServices>,
				E,
				FieldServices | Scope.Scope
			>,
			name: string,
		) =>
		(handler: (value: Decoded) => Promisable<void>) => {
			let subscribing = true;
			const fiber = runSubscription(
				subscribe().pipe(
					Effect.flatMap(
						Stream.runForEach((value) =>
							Effect.tryPromise(async () => handler(value)).pipe(
								Effect.catchTag("UnknownError", (error) =>
									Effect.logError(
										`Subscription handler for ${formatField(namespace, name)} threw`,
										error,
									),
								),
							),
						),
					),
					Effect.tapError((error) =>
						subscribing
							? Effect.void
							: Effect.logError(
									`Subscribe to ${formatField(namespace, name)} failed after it returned`,
									error,
								),
					),
					Effect.scoped,
				),
			);
			subscribing = false;

			const exit = fiber.pollUnsafe();
			if (typeof exit !== "undefined" && Exit.isFailure(exit)) {
				throw Cause.squash(exit.cause);
			}
			return () => {
				runFork(Fiber.interrupt(fiber));
			};
		};

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
