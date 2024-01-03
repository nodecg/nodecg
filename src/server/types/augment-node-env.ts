/* eslint-disable @typescript-eslint/no-namespace */
declare namespace NodeJS {
	interface ProcessEnv {
		/**
		 * Setting this is one of the first thing NodeCG does on startup.
		 */
		NODECG_ROOT: string;

		/**
		 * This is set by our test suite.
		 */
		NODECG_TEST?: string;

		/**
		 * This is set by the server core when under test.
		 */
		NODECG_TEST_PORT?: string;
	}
}
