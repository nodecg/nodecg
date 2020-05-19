// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { User as NodeCGUser } from '../database';

declare global {
	namespace Express {
		/**
		 * This is the idiomatic, intended way of
		 * adding one's User type to the Request object
		 * when using Express with Passport.
		 */
		interface User extends NodeCGUser {}
	}
}
