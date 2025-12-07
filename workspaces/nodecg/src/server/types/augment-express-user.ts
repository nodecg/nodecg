import type { User } from "@nodecg/database-adapter-types";

interface UserModel extends User {}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		/**
		 * This is the idiomatic, intended way of
		 * adding one's User type to the Request object
		 * when using Express with Passport.
		 */
		interface User extends UserModel {}
	}
}
