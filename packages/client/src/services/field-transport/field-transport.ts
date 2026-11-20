import { formatField, NamespacePath } from "@nodecg/internal";
import type { Patch, RevisionConflict } from "@nodecg/internal/occ";
import { Context, Data, type Effect, Schema } from "effect";

export class FieldNotFound extends Schema.TaggedError<FieldNotFound>()(
	"FieldNotFound",
	{ namespace: NamespacePath, name: Schema.String },
) {
	override readonly message = `Field ${formatField(this.namespace, this.name)} does not exist`;
}

export class FieldPermissionDenied extends Schema.TaggedError<FieldPermissionDenied>()(
	"FieldPermissionDenied",
	{ namespace: NamespacePath, name: Schema.String },
) {
	override readonly message = `Permission denied for ${formatField(this.namespace, this.name)}`;
}

export class FieldUnavailable extends Schema.TaggedError<FieldUnavailable>()(
	"FieldUnavailable",
	{
		namespace: NamespacePath,
		name: Schema.String,
		detail: Schema.optional(Schema.String),
	},
) {
	override readonly message = `Field ${formatField(this.namespace, this.name)} is currently unavailable${
		typeof this.detail === "undefined" ? "" : `: ${this.detail}`
	}`;
}

export class FieldGetError extends Schema.TaggedError<FieldGetError>()(
	"FieldGetError",
	{
		namespace: NamespacePath,
		name: Schema.String,
		cause: Schema.instanceOf(Error),
	},
) {
	override readonly message = `Failed to get field ${formatField(this.namespace, this.name)}: ${this.cause.message}`;
}

export class FieldSetError extends Schema.TaggedError<FieldSetError>()(
	"FieldSetError",
	{
		namespace: NamespacePath,
		name: Schema.String,
		cause: Schema.instanceOf(Error),
	},
) {
	override readonly message = `Failed to set field ${formatField(this.namespace, this.name)}: ${this.cause.message}`;
}

// Carries the fresh decoded value so the caller can merge or retry
export class ReplicantWriteConflict<out Decoded> extends Data.TaggedError(
	"ReplicantWriteConflict",
)<{
	readonly namespace: NamespacePath;
	readonly name: string;
	readonly current: Decoded;
	readonly revision: number;
}> {
	override readonly message = `Write to ${formatField(this.namespace, this.name)} conflicted with a concurrent update`;
}

export class TopicPublishError extends Schema.TaggedError<TopicPublishError>()(
	"TopicPublishError",
	{
		namespace: NamespacePath,
		name: Schema.String,
		cause: Schema.instanceOf(Error),
	},
) {
	override readonly message = `Failed to publish topic ${formatField(this.namespace, this.name)}: ${this.cause.message}`;
}

export class RpcCallError extends Schema.TaggedError<RpcCallError>()(
	"RpcCallError",
	{
		namespace: NamespacePath,
		name: Schema.String,
		cause: Schema.instanceOf(Error),
	},
) {
	override readonly message = `RPC call ${formatField(this.namespace, this.name)} failed: ${this.cause.message}`;
}

export interface FieldTransport {
	getReplicant: (
		namespace: NamespacePath,
		name: string,
	) => Effect.Effect<
		Schema.Json,
		FieldNotFound | FieldPermissionDenied | FieldGetError
	>;
	getComputed: (
		namespace: NamespacePath,
		name: string,
	) => Effect.Effect<
		Schema.Json,
		FieldNotFound | FieldPermissionDenied | FieldGetError
	>;
	updateReplicant: (
		namespace: NamespacePath,
		name: string,
		patch: Patch,
	) => Effect.Effect<
		void,
		FieldNotFound | FieldPermissionDenied | FieldSetError | RevisionConflict
	>;
	publishTopic: (
		namespace: NamespacePath,
		name: string,
		value: Schema.Json,
	) => Effect.Effect<
		void,
		FieldNotFound | FieldPermissionDenied | TopicPublishError
	>;
	callRpc: (
		namespace: NamespacePath,
		name: string,
		request: Schema.Json,
	) => Effect.Effect<
		Schema.Json,
		FieldNotFound | FieldPermissionDenied | RpcCallError
	>;
}

export class FieldTransportService extends Context.Service<
	FieldTransportService,
	FieldTransport
>()("FieldTransport") {}
