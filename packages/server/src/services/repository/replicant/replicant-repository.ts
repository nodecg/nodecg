import { Context, type Effect, Schema } from "effect";

import type { BackendError } from "../repository-errors.ts";

export class ReplicantNotFound extends Schema.TaggedError<ReplicantNotFound>()(
	"ReplicantNotFound",
	{ namespace: Schema.String, name: Schema.String },
) {
	override readonly message = `Replicant "${this.name}" in "${this.namespace}" does not exist`;
}

export class DecodeError extends Schema.TaggedError<DecodeError>()(
	"DecodeError",
	{ issue: Schema.String },
) {
	override readonly message = `Stored value does not decode: ${this.issue}`;
}

export interface ReplicantRepository {
	read: (
		namespace: string,
		name: string,
	) => Effect.Effect<
		Schema.Json,
		ReplicantNotFound | DecodeError | BackendError
	>;

	write: (
		namespace: string,
		name: string,
		value: Schema.Json,
	) => Effect.Effect<void, BackendError>;
}

export class ReplicantRepositoryService extends Context.Service<
	ReplicantRepositoryService,
	ReplicantRepository
>()("ReplicantRepository") {}
