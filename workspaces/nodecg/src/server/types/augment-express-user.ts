import type { User as UserModel } from "@nodecg/database-adapter-types";

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		/**
		 * This is the idiomatic, intended way of
		 * adding one's User type to the Request object
		 * when using Express with Passport.
		 */
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface User extends UserModel {}
	}
}
