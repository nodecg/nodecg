import { expect, Mock, test as baseTest, vi } from "vitest";

import { LogLevel } from "../../../types/logger-interface";
import { loggerFactory } from "./logger.client";

// Start up the logger lib with defaults only
const Logger = loggerFactory();

const test = baseTest
	.extend<{
		logger: InstanceType<typeof Logger>;
		SentryMock: { captureException: Mock };
	}>({
		logger: async ({}, use) => {
			const logger = new Logger("testClient");
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
				{
					console: {
						enabled: true,
					},
				},
				SentryMock as any,
			);
			await use(new SentryLogger("sentryClient"));
		},
	});

test("console - should default to being silent", () => {
	expect(Logger._silent).toBe(true);
});

test('console - should default to level "info"', () => {
	expect(Logger._level).toBe(LogLevel.Info);
});

test("replicant - should default to false", () => {
	expect(Logger._shouldLogReplicants).toBe(false);
});

test("replicant - should do nothing when Logger._shouldLogReplicants is false", ({
	logger,
}) => {
	const info = vi.spyOn(console, "info");
	logger.replicants("replicants");
	expect(info).not.toBeCalled();
});

test("logging methods should all do nothing when _silent is true", ({
	logger,
}) => {
	Logger._silent = true;
	Logger._level = LogLevel.Trace;

	const info = vi.spyOn(console, "info");

	// Trace
	logger.trace("trace");
	expect(info).not.toBeCalled();
	info.mockClear();

	// Debug
	logger.debug("debug");
	expect(info).not.toBeCalled();
	info.mockClear();

	// Info
	logger.info("info");
	expect(info).not.toBeCalled();
	info.mockClear();

	// Warn
	const warn = vi.spyOn(console, "warn");
	logger.warn("warn");
	expect(warn).not.toBeCalled();
	warn.mockRestore();

	// Error
	const error = vi.spyOn(console, "error");
	logger.error("error");
	expect(error).not.toBeCalled();
	error.mockRestore();

	// Replicants
	logger.replicants("replicants");
	expect(info).not.toBeCalled();

	info.mockRestore();
});

test("logging methods should all do nothing when the log level is above them", ({
	logger,
}) => {
	Logger._silent = false;
	Logger._level = LogLevel.Silent;

	const info = vi.spyOn(console, "info");

	// Trace
	logger.trace("trace");
	expect(info).not.toBeCalled();
	info.mockClear();

	// Debug
	logger.debug("debug");
	expect(info).not.toBeCalled();
	info.mockClear();

	// Info
	logger.info("info");
	expect(info).not.toBeCalled();
	info.mockClear();

	// Warn
	const warn = vi.spyOn(console, "warn");
	logger.warn("warn");
	expect(warn).not.toBeCalled();
	warn.mockRestore();

	// Error
	const error = vi.spyOn(console, "error");
	logger.error("error");
	expect(error).not.toBeCalled();
	error.mockRestore();

	info.mockRestore();
});

test("logging methods should all prepend the instance name to the output", ({
	logger,
}) => {
	Logger._level = LogLevel.Trace;
	Logger._silent = false;

	const info = vi.spyOn(console, "info");

	// Trace
	logger.trace("trace");
	expect(info).toBeCalledWith("[testClient]", "trace");
	info.mockClear();

	// Debug
	logger.debug("debug");
	expect(info).toBeCalledWith("[testClient]", "debug");
	info.mockClear();

	// Info
	logger.info("info");
	expect(info).toBeCalledWith("[testClient]", "info");
	info.mockClear();

	// Warn
	const warn = vi.spyOn(console, "warn");
	logger.warn("warn");
	expect(warn).toBeCalledWith("[testClient]", "warn");
	warn.mockRestore();

	// Error
	const error = vi.spyOn(console, "error");
	logger.error("error");
	expect(error).toBeCalledWith("[testClient]", "error");
	error.mockRestore();

	// Replicants
	Logger._shouldLogReplicants = true;
	logger.replicants("replicants");
	expect(info).toBeCalledWith("[testClient]", "replicants");
	Logger._shouldLogReplicants = false;

	info.mockRestore();
});

test("Sentry - should log errors to Sentry when global.sentryEnabled is true", ({
	sentryLogger,
	SentryMock,
}) => {
	sentryLogger.error("error message");
	expect(SentryMock.captureException).toBeCalledTimes(1);
	expect(SentryMock.captureException.mock.calls[0]![0]).toBeInstanceOf(Error);
	expect(
		SentryMock.captureException.mock.calls[0]![0].message,
	).toMatchInlineSnapshot(`"[sentryClient] error message"`);
});

test("Sentry - should prettyprint objects", ({ sentryLogger, SentryMock }) => {
	sentryLogger.error("error message:", { foo: { bar: "baz" } });
	expect(
		SentryMock.captureException.mock.calls[0]![0].message,
	).toMatchInlineSnapshot(
		`"[sentryClient] error message: { foo: { bar: 'baz' } }"`,
	);
});
