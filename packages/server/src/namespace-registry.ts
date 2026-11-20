import type { NamespacePath } from "@nodecg/internal";
import { Context, type HashMap, type HashSet } from "effect";

import type { CustomRoute } from "./build-custom-routes.ts";
import { type BuiltNamespace } from "./build-fields.ts";
import type { fieldInternal } from "./field-builders/field-internal-key.ts";
import type { FrontendConfig } from "./implement-namespace.ts";

// Exclude Decoded types
export type ReplicantFieldInternal = Pick<
	BuiltNamespace["replicant"][string][typeof fieldInternal],
	"getRevisioned" | "commitPatch" | "subscribeRevisioned" | "canRead"
>;
export type ComputedFieldInternal = Pick<
	BuiltNamespace["computed"][string][typeof fieldInternal],
	"getEncoded" | "getEncodedNoAuth" | "subscribeEncoded" | "canRead"
>;
export type TopicFieldInternal = Pick<
	BuiltNamespace["topic"][string][typeof fieldInternal],
	"publishEncoded" | "subscribeEncoded" | "canRead"
>;
type RpcFieldInternal = BuiltNamespace["rpc"][string][typeof fieldInternal];

type Fields<
	F extends
		| ReplicantFieldInternal
		| ComputedFieldInternal
		| TopicFieldInternal
		| RpcFieldInternal,
> = Readonly<Record<string, { readonly [fieldInternal]: F }>>;

export interface RegisteredNamespace {
	readonly frontend?: FrontendConfig;
	readonly customRoute?: HashSet.HashSet<CustomRoute>;
	readonly fields: {
		readonly replicant: Fields<ReplicantFieldInternal>;
		readonly computed: Fields<ComputedFieldInternal>;
		readonly topic: Fields<TopicFieldInternal>;
		readonly rpc: Fields<RpcFieldInternal>;
	};
}

export class NamespaceRegistryService extends Context.Service<
	NamespaceRegistryService,
	HashMap.HashMap<NamespacePath, RegisteredNamespace>
>()("NamespaceRegistry") {}
