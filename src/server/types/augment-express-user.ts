import type { User as UserModel } from "../../types/models";

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		/**
		 * This is the idiomatic, intended way of
		 * adding one's User type to the Request object
		 * when using Express with Passport.
		 */
		interface User extends UserModel {} // eslint-disable-line @typescript-eslint/no-empty-interface
	}
}
