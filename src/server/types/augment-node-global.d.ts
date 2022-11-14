export {};

declare global {
	/**
	 * It'd be good to refactor the program to not need these, if possible.
	 * But, they aren't really hurting anything.
	 */
	var exitOnUncaught: boolean;
	var sentryEnabled: boolean;
}
