import { Effect, Data, Schema } from "effect";
import { HttpClient, HttpClientRequest } from "@effect/platform";

export class HttpError extends Data.TaggedError("HttpError")<{
	readonly message: string;
	readonly url?: string;
	readonly statusCode?: number;
}> {}

export class HttpService extends Effect.Service<HttpService>()("HttpService", {
	effect: Effect.gen(function* () {
		const client = yield* HttpClient.HttpClient;

		return {
			fetchJson: <A, I, R>(
				url: string,
				schema: Schema.Schema<A, I, R>,
			) => Effect.gen(function* () {
				const response = yield* HttpClientRequest.get(url).pipe(
					client.execute,
					Effect.mapError(
						(e) =>
							new HttpError({
								message: `HTTP request failed`,
								url,
								statusCode:
									"status" in e && typeof e.status === "number"
										? e.status
										: undefined,
							}),
					),
				);

				const json = yield* response.json.pipe(
					Effect.mapError(
						() => new HttpError({ message: `Failed to parse JSON`, url }),
					),
				);

				return yield* Schema.decodeUnknown(schema)(json).pipe(
					Effect.mapError(
						() => new HttpError({ message: `Invalid response schema`, url }),
					),
				);
			}).pipe(Effect.withSpan("fetchJson")),

			fetchStream: Effect.fn("fetchStream")(function* (url: string) {
				const response = yield* HttpClientRequest.get(url).pipe(
					client.execute,
					Effect.mapError(
						(e) =>
							new HttpError({
								message: `Failed to fetch stream`,
								url,
								statusCode:
									"status" in e && typeof e.status === "number"
										? e.status
										: undefined,
							}),
					),
				);
				return response.stream;
			}),

			fetch: Effect.fn("fetch")(function* (url: string) {
				return yield* HttpClientRequest.get(url).pipe(
					client.execute,
					Effect.mapError(
						(e) =>
							new HttpError({
								message: `HTTP request failed`,
								url,
								statusCode:
									"status" in e && typeof e.status === "number"
										? e.status
										: undefined,
							}),
					),
				);
			}),
		};
	}),
	},
) {}
