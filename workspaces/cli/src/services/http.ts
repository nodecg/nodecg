import { Effect, Data } from "effect";
import { HttpClient, HttpClientRequest } from "@effect/platform";
import { Schema } from "@effect/schema";

export class HttpError extends Data.TaggedError("HttpError")<{
	readonly message: string;
	readonly url?: string;
	readonly statusCode?: number;
}> {}

export class HttpService extends Effect.Service<HttpService>()("HttpService", {
	effect: Effect.fn("HttpService.make")(function* () {
		const client = yield* HttpClient.HttpClient;

		return {
			fetchJson: <A>(url: string, schema: Schema.Schema<A, unknown>) =>
				Effect.fn("fetchJson")(function* () {
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
							() =>
								new HttpError({ message: `Invalid response schema`, url }),
						),
					);
				}),

			fetchStream: (url: string) =>
				Effect.fn("fetchStream")(function* () {
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

			fetch: (url: string) =>
				Effect.fn("fetch")(function* () {
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
	dependencies: [HttpClient.HttpClient.Default],
}) {}
