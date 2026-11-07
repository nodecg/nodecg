import { Effect } from "effect";

// TODO: support automatic migrations
export const migrationDie = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
	effect.pipe(
		Effect.mapError(
			() =>
				"Currently stored replicant value failed schema validation. Migration is not supported yet.",
		),
		Effect.orDie,
	);
