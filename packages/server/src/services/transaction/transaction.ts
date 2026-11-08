import { Context, type Effect } from "effect";

import type { BackendError } from "../repository/repository-errors.ts";

export interface Transaction {
	readonly wrap: <A, E, R>(
		effect: Effect.Effect<A, E, R>,
	) => Effect.Effect<A, E | BackendError, R>;
}

export class TransactionService extends Context.Service<
	TransactionService,
	Transaction
>()("Transaction") {
	static readonly wrap = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
		TransactionService.use((tx) => tx.wrap(effect));
}
