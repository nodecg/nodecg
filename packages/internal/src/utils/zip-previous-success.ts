import { Option, Result, Stream } from "effect";

export const zipPreviousSuccess = <A, E>(
	stream: Stream.Stream<Result.Result<A, E>>,
) =>
	stream.pipe(
		Stream.mapAccum(
			(): Option.Option<A> => Option.none(),
			(previous, element) =>
				[
					element.pipe(
						Result.map(Option.some),
						Result.getOrElse(() => previous),
					),
					[element.pipe(Result.map((value) => [previous, value] as const))],
				] as const,
		),
	);
