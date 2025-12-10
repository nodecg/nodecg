import { Effect, Function } from "effect";

export const expectError = <E>() => Function.identity<Effect.Effect<void, E>>;
