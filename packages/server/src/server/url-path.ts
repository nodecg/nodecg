import { Context, Layer, Path } from "effect";

/**
 * Path implementation used for URL pathnames. Always POSIX and platform agnostic.
 */
export class UrlPath extends Context.Service<UrlPath, Path.Path>()("UrlPath") {
	static readonly layer = Layer.effect(this, Path.Path).pipe(
		Layer.provide(Path.layer),
	);
}
