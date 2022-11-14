import { User as NodeCGUser } from '../database';

/**
 * This is the idiomatic, intended way of adding fields to the session
 */
declare module 'express-session' {
	interface SessionData {
		returnTo?: string;
	}
}
