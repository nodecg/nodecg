/**
 * This is the idiomatic, intended way of adding fields to the session
 */
declare module 'express-session' {
	interface SessionData {
		returnTo?: string;
	}
}

// This export needs to be here to make this file be a module. It serves no other purpose. It can be anything.
export {};
