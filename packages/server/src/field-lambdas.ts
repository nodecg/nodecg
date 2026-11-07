import type {
	FieldManifest,
	ReplicantFieldManifest,
	RpcFieldManifest,
	WidestRpcField,
} from "@nodecg-next/core";
import type { HKT } from "effect";
import type { Promisable } from "type-fest";

import type { ComputedFieldEffect } from "./field-builders/build-computed.ts";
import type { ReplicantFieldEffect } from "./field-builders/build-replicant.ts";
import type { RpcFieldEffect } from "./field-builders/build-rpc.ts";
import type { TopicFieldEffect } from "./field-builders/build-topic.ts";
import type {
	ComputedField,
	ReplicantField,
	RpcComputedAccessor,
	RpcField,
	RpcReplicantAccessor,
	RpcTopicAccessor,
	TopicField,
} from "./implement-namespace.ts";

export interface FieldManifestLambda extends HKT.TypeLambda {
	readonly type: FieldManifest<this["Target"]>;
}

export interface ReplicantFieldManifestLambda extends HKT.TypeLambda {
	readonly type: ReplicantFieldManifest<this["Target"]>;
}

export interface DecodedLambda extends HKT.TypeLambda {
	readonly type: this["Target"];
}

export type FieldRead<Decoded> = { readonly get: () => Decoded };

export interface FieldReadLambda extends HKT.TypeLambda {
	readonly type: FieldRead<this["Target"]>;
}

export interface ComputeFnLambda extends HKT.TypeLambda {
	readonly type: (ctx: this["In"]) => this["Target"];
}

export interface SeedFnLambda extends HKT.TypeLambda {
	readonly type: () => this["Target"];
}

export interface ReplicantFieldEffectLambda extends HKT.TypeLambda {
	readonly type: ReplicantFieldEffect<this["Target"]>;
}

export interface ComputedFieldEffectLambda extends HKT.TypeLambda {
	readonly type: ComputedFieldEffect<this["Target"]>;
}

export interface TopicFieldEffectLambda extends HKT.TypeLambda {
	readonly type: TopicFieldEffect<this["Target"]>;
}

export interface RpcFieldEffectLambda extends HKT.TypeLambda {
	readonly Target: WidestRpcField;
	readonly type: RpcFieldEffect<
		this["Target"]["request"],
		this["Target"]["response"]
	>;
}

export interface RpcFieldManifestLambda extends HKT.TypeLambda {
	readonly Target: WidestRpcField;
	readonly type: RpcFieldManifest<
		this["Target"]["request"],
		this["Target"]["response"]
	>;
}

export interface RpcHandlerLambda extends HKT.TypeLambda {
	readonly Target: WidestRpcField;
	readonly type: (
		request: this["Target"]["request"],
		ctx: this["In"],
	) => Promisable<this["Target"]["response"]>;
}

export interface RpcReplicantAccessorLambda extends HKT.TypeLambda {
	readonly type: RpcReplicantAccessor<this["Target"]>;
}

export interface RpcComputedAccessorLambda extends HKT.TypeLambda {
	readonly type: RpcComputedAccessor<this["Target"]>;
}

export interface RpcTopicAccessorLambda extends HKT.TypeLambda {
	readonly type: RpcTopicAccessor<this["Target"]>;
}

export interface ReplicantFieldLambda extends HKT.TypeLambda {
	readonly type: ReplicantField<this["Target"]>;
}

export interface ComputedFieldLambda extends HKT.TypeLambda {
	readonly type: ComputedField<this["Target"]>;
}

export interface TopicFieldLambda extends HKT.TypeLambda {
	readonly type: TopicField<this["Target"]>;
}

export interface RpcFieldLambda extends HKT.TypeLambda {
	readonly Target: WidestRpcField;
	readonly type: RpcField<
		this["Target"]["request"],
		this["Target"]["response"]
	>;
}
