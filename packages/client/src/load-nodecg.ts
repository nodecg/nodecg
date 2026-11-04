import type {
	NamespaceManifest,
	WidestNamespaceManifests,
} from "@nodecg-next/core";
import {
	type ApplyLambdaToObjectValues,
	findCaseClash,
	mapEffectValues,
	mapValues,
} from "@nodecg-next/internal/utils";
import {
	Effect,
	type HKT,
	Layer,
	ManagedRuntime,
	Option,
	Path,
	Schema,
	Scope,
} from "effect";
import { FetchHttpClient } from "effect/http";

import { adaptAuthClient, makeAuthClient } from "./auth-client.ts";
import {
	adaptNamespace,
	type BuiltNamespace,
	type LoadedNamespace,
	loadNamespaceEffect,
} from "./load-namespace.ts";
import { otlpTelemetry } from "./otlp-telemetry.ts";
import { httpFieldTransport } from "./services/field-transport/http-field-transport.ts";
import { webSocketMessageChannel } from "./services/message-channel/websocket-message-channel.ts";

export class DuplicateNamespace extends Schema.TaggedError<DuplicateNamespace>()(
	"DuplicateNamespace",
	{ namespace: Schema.String, clash: Schema.String },
) {
	override readonly message =
		this.namespace === this.clash
			? `Namespace "${this.namespace}" was loaded twice`
			: `Namespace "${this.namespace}" differs from "${this.clash}" only in case`;
}

class ReportedError extends Schema.TaggedError<ReportedError>()(
	"ReportedError",
	{ cause: Schema.Defect() },
) {
	override readonly message = String(this.cause);
}

type InferManifestFields<Manifest> =
	Manifest extends NamespaceManifest<string, infer S, string, any> ? S : never;

type InferManifestCustomRoutes<Manifest> =
	Manifest extends NamespaceManifest<string, any, string, infer CustomRoutes>
		? CustomRoutes
		: never;

interface ManifestLambda extends HKT.TypeLambda {
	readonly type: NamespaceManifest<
		string,
		InferManifestFields<this["Target"]>,
		string,
		InferManifestCustomRoutes<this["Target"]>
	>;
}

interface BuiltNamespaceLambda extends HKT.TypeLambda {
	readonly type: BuiltNamespace<
		InferManifestFields<this["Target"]>,
		InferManifestCustomRoutes<this["Target"]>
	>;
}

interface NamespaceHandleLambda extends HKT.TypeLambda {
	readonly type: Omit<
		LoadedNamespace<
			InferManifestFields<this["Target"]>,
			InferManifestCustomRoutes<this["Target"]>
		>,
		"dispose"
	>;
}

export type LoadNodeCGOptions<Manifests extends WidestNamespaceManifests> = {
	readonly baseUrl?: string;
	readonly namespaces: Manifests &
		ApplyLambdaToObjectValues<ManifestLambda, Manifests>;
};

const loadNamespaces = Effect.fnUntraced(function* <
	Manifests extends WidestNamespaceManifests,
>(options: LoadNodeCGOptions<Manifests>) {
	// Widen the type to allow inference of mapEffectValues
	const manifests: ApplyLambdaToObjectValues<ManifestLambda, Manifests> =
		options.namespaces;

	const loaded = new Set<string>();
	for (const { namespace } of Object.values(manifests)) {
		if (loaded.has(namespace)) {
			return yield* DuplicateNamespace.make({ namespace, clash: namespace });
		}
		loaded.add(namespace);
	}
	const clash = findCaseClash(loaded, []);
	if (Option.isSome(clash)) {
		return yield* DuplicateNamespace.make({
			namespace: clash.value.name,
			clash: clash.value.clash,
		});
	}

	const namespaces = yield* mapEffectValues<
		ManifestLambda,
		BuiltNamespaceLambda
	>()((manifest) =>
		loadNamespaceEffect(manifest, { baseUrl: options.baseUrl }),
	)(manifests);
	const auth = yield* makeAuthClient(options.baseUrl);
	return { namespaces, auth };
});

export const loadNodeCGEffect = Effect.fnUntraced(function* <
	Manifests extends WidestNamespaceManifests,
>(options: LoadNodeCGOptions<Manifests>) {
	const telemetry = yield* Layer.build(otlpTelemetry(options.baseUrl));
	return yield* loadNamespaces(options).pipe(
		Effect.withSpan("loadNodeCG"),
		Effect.provide(telemetry),
	);
});

export interface LoadedNodeCG<Manifests extends WidestNamespaceManifests> {
	readonly namespaces: ApplyLambdaToObjectValues<
		NamespaceHandleLambda,
		Manifests
	>;
	readonly auth: ReturnType<typeof adaptAuthClient>;
	readonly reportError: (error: unknown) => void;
	readonly dispose: () => void;
}

/**
 * Client-side entrypoint loading every namespace of the record over one connection
 */
export async function loadNodeCG<Manifests extends WidestNamespaceManifests>(
	options: LoadNodeCGOptions<Manifests>,
): Promise<LoadedNodeCG<Manifests>> {
	const runtime = ManagedRuntime.make(
		Layer.mergeAll(
			httpFieldTransport(options.baseUrl),
			webSocketMessageChannel(options.baseUrl),
			FetchHttpClient.layer,
			otlpTelemetry(options.baseUrl),
		).pipe(Layer.provide(Path.layer)),
	);

	const { namespaces, auth } = await runtime.runPromise(
		loadNamespaces(options).pipe(
			Effect.withSpan("loadNodeCG"),
			Scope.provide(runtime.scope),
			Effect.onError(() => runtime.disposeEffect),
		),
	);

	return {
		namespaces: mapValues<BuiltNamespaceLambda, NamespaceHandleLambda>(
			(built) => adaptNamespace(runtime, built),
		)(namespaces),
		auth: adaptAuthClient(runtime, Effect.succeed(auth)),
		reportError: (error) => {
			runtime.runFork(
				ReportedError.make({ cause: error }).pipe(
					Effect.withSpan("reportError"),
					Effect.exit,
				),
			);
		},
		dispose: runtime.dispose,
	};
}
