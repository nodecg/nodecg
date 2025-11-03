import type { DatabaseAdapter } from "@nodecg/database-adapter-types";

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		export interface Locals {
			databaseAdapter: DatabaseAdapter;
		}

		export interface Request {
			/**
			 * The raw request body as a Buffer.
			 *
			 * This property is populated by NodeCG's body-parser middleware and contains
			 * the original, unparsed request body. This is particularly useful for verifying
			 * webhook signatures, where the exact bytes of the request body are needed to
			 * compute a hash that matches the signature provided by the webhook service.
			 */
			rawBody?: Buffer;
		}
	}
}
