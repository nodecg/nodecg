import type { RoleName } from "@nodecg-next/internal";
import { Context, Effect, HashSet, Layer } from "effect";

import type { CustomRoute } from "./build-custom-routes.ts";
import { type BuiltNamespace } from "./build-fields.ts";
import { fieldInternal } from "./field-builders/field-internal-key.ts";
import type { FrontendConfig } from "./implement-namespace.ts";

// Exclude Decoded types
export type ReplicantFieldInternal = Pick<
	BuiltNamespace["replicant"][string][typeof fieldInternal],
	"getRevisioned" | "commitPatch" | "subscribeRevisioned" | "permission"
>;
export type ComputedFieldInternal = Pick<
	BuiltNamespace["computed"][string][typeof fieldInternal],
	"getEncoded" | "getEncodedNoAuth" | "subscribeEncoded" | "permission"
>;
export type TopicFieldInternal = Pick<
	BuiltNamespace["topic"][string][typeof fieldInternal],
	"publishEncoded" | "subscribeEncoded" | "permission"
>;
type RpcFieldInternal = BuiltNamespace["rpc"][string][typeof fieldInternal];

export interface NamespaceRegistry {
	readonly replicant: ReadonlyMap<
		string,
		ReadonlyMap<string, ReplicantFieldInternal>
	>;
	readonly computed: ReadonlyMap<
		string,
		ReadonlyMap<string, ComputedFieldInternal>
	>;
	readonly topic: ReadonlyMap<string, ReadonlyMap<string, TopicFieldInternal>>;
	readonly rpc: ReadonlyMap<string, ReadonlyMap<string, RpcFieldInternal>>;
	readonly customRoute: ReadonlyMap<string, HashSet.HashSet<CustomRoute>>;
	readonly declaredRoles: ReadonlyMap<string, ReadonlySet<RoleName>>;
	readonly frontend: ReadonlyMap<string, FrontendConfig>;
}

export interface RegisteredNamespace {
	readonly namespace: string;
	readonly declaredRoles: ReadonlySet<RoleName>;
	readonly frontend?: FrontendConfig;
	readonly customRoute?: HashSet.HashSet<CustomRoute>;
	readonly fields: {
		readonly replicant: Record<
			string,
			{ readonly [fieldInternal]: ReplicantFieldInternal }
		>;
		readonly computed: Record<
			string,
			{ readonly [fieldInternal]: ComputedFieldInternal }
		>;
		readonly topic: Record<
			string,
			{ readonly [fieldInternal]: TopicFieldInternal }
		>;
		readonly rpc: Record<
			string,
			{ readonly [fieldInternal]: RpcFieldInternal }
		>;
	};
}

export class NamespaceRegistryService extends Context.Service<NamespaceRegistryService>()(
	"NamespaceRegistry",
	{
		make: (namespaces: ReadonlyArray<RegisteredNamespace>) =>
			Effect.sync((): NamespaceRegistry => {
				const replicant = new Map<
					string,
					Map<string, ReplicantFieldInternal>
				>();
				const computed = new Map<string, Map<string, ComputedFieldInternal>>();
				const topic = new Map<string, Map<string, TopicFieldInternal>>();
				const rpc = new Map<string, Map<string, RpcFieldInternal>>();
				const customRoute = new Map<string, HashSet.HashSet<CustomRoute>>();
				const declaredRoles = new Map<string, ReadonlySet<RoleName>>();
				const frontend = new Map<string, FrontendConfig>();
				for (const registered of namespaces) {
					const { namespace, fields } = registered;
					declaredRoles.set(namespace, registered.declaredRoles);
					if (typeof registered.frontend !== "undefined") {
						frontend.set(namespace, registered.frontend);
					}
					const replicantFields = new Map<string, ReplicantFieldInternal>();
					for (const [name, field] of Object.entries(fields.replicant)) {
						replicantFields.set(name, field[fieldInternal]);
					}
					replicant.set(namespace, replicantFields);
					const computedFields = new Map<string, ComputedFieldInternal>();
					for (const [name, field] of Object.entries(fields.computed)) {
						computedFields.set(name, field[fieldInternal]);
					}
					computed.set(namespace, computedFields);
					const topicFields = new Map<string, TopicFieldInternal>();
					for (const [name, field] of Object.entries(fields.topic)) {
						topicFields.set(name, field[fieldInternal]);
					}
					topic.set(namespace, topicFields);
					const rpcFields = new Map<string, RpcFieldInternal>();
					for (const [name, field] of Object.entries(fields.rpc)) {
						rpcFields.set(name, field[fieldInternal]);
					}
					rpc.set(namespace, rpcFields);
					customRoute.set(namespace, registered.customRoute ?? HashSet.empty());
				}
				return {
					replicant,
					computed,
					topic,
					rpc,
					customRoute,
					declaredRoles,
					frontend,
				};
			}),
	},
) {
	static readonly layer = (namespaces: ReadonlyArray<RegisteredNamespace>) =>
		Layer.effect(this, this.make(namespaces));
}
