import { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Cause, Effect, Option, Schema } from "effect";
import { SqlError } from "effect/sql";

// https://www.sqlite.org/rescode.html#constraint_primarykey
const isSqlitePrimaryKeyViolation = Schema.is(
	Schema.Struct({ errcode: Schema.Literal(1555) }),
);

const isDrizzleQueryError = Schema.is(EffectDrizzleQueryError);

export const retryOnIdCollision = <A, E, R>(
	effect: Effect.Effect<A, E | EffectDrizzleQueryError, R>,
) =>
	effect.pipe(
		Effect.retry({
			times: 2,
			while: (error) =>
				isDrizzleQueryError(error) &&
				Cause.isCause(error.cause) &&
				Cause.findErrorOption(error.cause).pipe(
					Option.filter(SqlError.isSqlError),
					Option.map(({ reason }) => reason),
					Option.filter(Schema.is(SqlError.ConstraintError)),
					Option.map(({ cause }) => cause),
					Option.exists(isSqlitePrimaryKeyViolation),
				),
		}),
	);
