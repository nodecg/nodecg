import { NamespacePath } from "@nodecg/internal";
import { Context, type Effect, Schema } from "effect";

import type { BackendError } from "../repository-errors.ts";

export class ReplicantNotFound extends Schema.TaggedError<ReplicantNotFound>()(
	"ReplicantNotFound",
	{ namespace: NamespacePath, name: Schema.String },
) {
	override readonly message = `Replicant "${this.name}" in "${this.namespace.join("/")}" does not exist`;
}

export class DecodeError extends Schema.TaggedError<DecodeError>()(
	"DecodeError",
	{ issue: Schema.String },
) {
	override readonly message = `Stored value does not decode: ${this.issue}`;
}

export interface ReplicantRepository {
	read: (
		namespace: NamespacePath,
		name: string,
	) => Effect.Effect<
		Schema.Json,
		ReplicantNotFound | DecodeError | BackendError
	>;

	write: (
		namespace: NamespacePath,
		name: string,
		value: Schema.Json,
	) => Effect.Effect<void, BackendError>;
}

export class ReplicantRepositoryService extends Context.Service<
	ReplicantRepositoryService,
	ReplicantRepository
>()("ReplicantRepository") {}
