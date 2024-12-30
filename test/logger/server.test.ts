import fs from "node:fs";
import path from "node:path";

import tmp from "tmp-promise";
import { expect, Mock, test as baseTest, vi } from "vitest";

import { loggerFactory } from "../../src/server/logger/logger.server";

tmp.setGracefulCleanup();
const tempFolder = tmp.dirSync().name;
const logsDir = path.join(tempFolder, "logs");

// Start up the logger lib
const Logger = loggerFactory({
	file: { path: path.join(logsDir, "nodecg.log") },
});

const test = baseTest
	.extend<{
		logger: InstanceType<typeof Logger>;
		SentryMock: { captureException: Mock };
	}>({
		logger: async ({}, use) => {
			const logger = new Logger("testServer");
			await use(logger);
		},
		SentryMock: async ({}, use) => {
			const SentryMock = {
				captureException: vi.fn(),
			};
			await use(SentryMock);
		},
	})
	.extend<{ sentryLogger: InstanceType<typeof Logger> }>({
		sentryLogger: async ({ SentryMock }, use) => {
			const SentryLogger = loggerFactory(
				{ file: { path: path.join(logsDir, "sentry.log") } },
				SentryMock as any,
			);
			await use(new SentryLogger("sentryServer"));
		},
	});

test("console - should default to being silent", () => {
	expect(Logger._consoleLogger.transports[0].silent).toBe(true);
});

test('console - should default to level "info"', () => {
	expect(Logger._consoleLogger.transports[0].level).toBe("info");
});

test("file - should default to being silent", () => {
	expect(Logger._fileLogger.transports[0].silent).toBe(true);
});

test('file - should default to level "info"', () => {
	expect(Logger._fileLogger.transports[0].level).toBe("info");
});

test("file - should make the logs folder", () => {
	expect(fs.existsSync(logsDir)).toBe(true);
});

test("replicant - should default to false", () => {
	expect(Logger._shouldConsoleLogReplicants).toBe(false);
	expect(Logger._shouldFileLogReplicants).toBe(false);
});

test("replicant - should do nothing when Logger._shouldLogReplicants is false", ({
	logger,
}) => {
	const consoleInfo = vi.spyOn(Logger._consoleLogger, "info");

	logger.replicants("replicants");
	expect(consoleInfo).not.toBeCalled();
	consoleInfo.mockRestore();

	const fileInfo = vi.spyOn(Logger._fileLogger, "info");
	logger.replicants("replicants");
	expect(fileInfo).not.toBeCalled();
	fileInfo.mockRestore();
});

test("Sentry - should log errors to Sentry when global.sentryEnabled is true", ({
	sentryLogger,
	SentryMock,
}) => {
	sentryLogger.error("error message");
	expect(SentryMock.captureException).toBeCalledTimes(1);
	expect(SentryMock.captureException.mock.calls[0]).toMatchInlineSnapshot(`
		[
		  [Error: [sentryServer] error message],
		]
	`);
});

test("Sentry - should prettyprint objects", ({ sentryLogger, SentryMock }) => {
	sentryLogger.error("error message:", { foo: { bar: "baz" } });
	expect(SentryMock.captureException.mock.calls[0]).toMatchInlineSnapshot(`
		[
		  [Error: [sentryServer] error message: { foo: { bar: 'baz' } }],
		]
	`);
});
