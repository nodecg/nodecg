declare namespace NodeJS {
	export interface ProcessEnv {
		/**
		 * Setting this is one of the first thing NodeCG does on startup.
		 */
		NODECG_ROOT: string;

		/**
		 * This is set by our test suite.
		 */
		NODECG_TEST?: string;
	}
}
