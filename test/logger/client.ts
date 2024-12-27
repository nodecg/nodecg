import sinon from "sinon";
import type { TestFn } from "ava";
import anyTest from "ava";
import { loggerFactory } from "../../src/client/api/logger/logger.client";
import { LogLevel } from "../../src/types/logger-interface";

// Start up the logger lib with defaults only
const Logger = loggerFactory();

interface TestContext {
	logger: InstanceType<typeof Logger>;
	SentryMock: any;
	sentryLogger: InstanceType<typeof Logger>;
}

const test = anyTest as TestFn<TestContext>;

test.beforeEach((t) => {
	t.context.logger = new Logger("testClient");

	const SentryMock: any = {
		captureException: sinon.stub(),
	};
	const SentryLogger = loggerFactory(
		{
			console: {
				enabled: true,
			},
		},
		SentryMock,
	);
	t.context.SentryMock = SentryMock;
	t.context.sentryLogger = new SentryLogger("sentryClient");
});

test("console - should default to being silent", (t) => {
	t.is(Logger._silent, true);
});

test('console - should default to level "info"', (t) => {
	t.is(Logger._level, LogLevel.Info);
});

test("replicant - should default to false", (t) => {
	t.is(Logger._shouldLogReplicants, false);
});

test("replicant - should do nothing when Logger._shouldLogReplicants is false", (t) => {
	const info = sinon.spy(console, "info");
	t.context.logger.replicants("replicants");
	t.is(info.called, false);
	info.restore();
});

test("logging methods should all do nothing when _silent is true", (t) => {
	Logger._silent = true;
	Logger._level = LogLevel.Trace;

	// Trace
	let info = sinon.spy(console, "info");
	t.context.logger.trace("trace");
	t.is(info.called, false);
	info.restore();

	// Debug
	info = sinon.spy(console, "info");
	t.context.logger.debug("debug");
	t.is(info.called, false);
	info.restore();

	// Info
	info = sinon.spy(console, "info");
	t.context.logger.info("info");
	t.is(info.called, false);
	info.restore();

	// Warn
	const warn = sinon.spy(console, "warn");
	t.context.logger.warn("warn");
	t.is(warn.called, false);
	warn.restore();

	// Error
	const error = sinon.spy(console, "error");
	t.context.logger.error("error");
	t.is(error.called, false);
	error.restore();

	// Replicants
	info = sinon.spy(console, "info");
	t.context.logger.replicants("replicants");
	t.is(info.called, false);
	info.restore();
});

test("logging methods should all do nothing when the log level is above them", (t) => {
	Logger._silent = false;
	Logger._level = LogLevel.Silent;

	// Trace
	let info = sinon.spy(console, "info");
	t.context.logger.trace("trace");
	t.is(info.called, false);
	info.restore();

	// Debug
	info = sinon.spy(console, "info");
	t.context.logger.debug("debug");
	t.is(info.called, false);
	info.restore();

	// Info
	info = sinon.spy(console, "info");
	t.context.logger.info("info");
	t.is(info.called, false);
	info.restore();

	// Warn
	const warn = sinon.spy(console, "warn");
	t.context.logger.warn("warn");
	t.is(warn.called, false);
	warn.restore();

	// Error
	const error = sinon.spy(console, "error");
	t.context.logger.error("error");
	t.is(error.called, false);
	error.restore();
});

test("logging methods should all prepend the instance name to the output", (t) => {
	Logger._level = LogLevel.Trace;
	Logger._silent = false;

	// Trace
	let info = sinon.spy(console, "info");
	t.context.logger.trace("trace");
	t.deepEqual(info.getCall(0).args, ["[testClient]", "trace"]);
	info.restore();

	// Debug
	info = sinon.spy(console, "info");
	t.context.logger.debug("debug");
	t.deepEqual(info.getCall(0).args, ["[testClient]", "debug"]);
	info.restore();

	// Info
	info = sinon.spy(console, "info");
	t.context.logger.info("info");
	t.deepEqual(info.getCall(0).args, ["[testClient]", "info"]);
	info.restore();

	// Warn
	const warn = sinon.spy(console, "warn");
	t.context.logger.warn("warn");
	t.deepEqual(warn.getCall(0).args, ["[testClient]", "warn"]);
	warn.restore();

	// Error
	const error = sinon.spy(console, "error");
	t.context.logger.error("error");
	t.deepEqual(error.getCall(0).args, ["[testClient]", "error"]);
	error.restore();

	// Replicants
	Logger._shouldLogReplicants = true;
	info = sinon.spy(console, "info");
	t.context.logger.replicants("replicants");
	t.deepEqual(info.getCall(0).args, ["[testClient]", "replicants"]);
	info.restore();
	Logger._shouldLogReplicants = false;
});

test("Sentry - should log errors to Sentry when global.sentryEnabled is true", (t) => {
	t.context.sentryLogger.error("error message");
	t.true(t.context.SentryMock.captureException.calledOnce);
	t.true(
		t.context.SentryMock.captureException.firstCall.args[0] instanceof Error,
		"first arg is Error",
	);
	t.is(
		t.context.SentryMock.captureException.firstCall.args[0].message,
		"[sentryClient] error message",
	);
});

test("Sentry - should prettyprint objects", (t) => {
	t.context.sentryLogger.error("error message:", { foo: { bar: "baz" } });
	t.is(
		t.context.SentryMock.captureException.firstCall.args[0].message,
		"[sentryClient] error message: { foo: { bar: 'baz' } }",
	);
});
