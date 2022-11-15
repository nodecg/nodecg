// Native
import path from 'path';

// Packages
import fs from 'fs-extra';
import sinon from 'sinon';
import type { TestFn } from 'ava';
import anyTest from 'ava';
import tmp from 'tmp-promise';

// Ours
import loggerFactory from '../../src/server/logger/logger.server';

tmp.setGracefulCleanup();
const tempFolder = tmp.dirSync().name;
const logsDir = path.join(tempFolder, 'logs');

// Start up the logger lib
const Logger = loggerFactory({ file: { path: path.join(logsDir, 'nodecg.log') } });

type TestContext = {
	logger: InstanceType<typeof Logger>;
	SentryMock: any;
	sentryLogger: InstanceType<typeof Logger>;
};

const test = anyTest as TestFn<TestContext>;

test.beforeEach((t) => {
	t.context.logger = new Logger('testServer');

	const SentryMock: any = {
		captureException: sinon.stub(),
	};
	const sentryLogger = loggerFactory({ file: { path: path.join(logsDir, 'sentry.log') } }, SentryMock);
	t.context.SentryMock = SentryMock;
	t.context.sentryLogger = new sentryLogger('sentryServer');
});

test('console - should default to being silent', (t) => {
	t.is(Logger._winston.transports[0].silent, true);
});

test('console - should default to level "info"', (t) => {
	t.is(Logger._winston.transports[0].level, 'info');
});

test('file - should default to being silent', (t) => {
	t.is(Logger._winston.transports[1].silent, true);
});

test('file - should default to level "info"', (t) => {
	t.is(Logger._winston.transports[1].level, 'info');
});

test('file - should make the logs folder', (t) => {
	t.is(fs.existsSync(logsDir), true);
});

test('replicant - should default to false', (t) => {
	t.is(Logger._shouldLogReplicants, false);
});

test('replicant - should do nothing when Logger._shouldLogReplicants is false', (t) => {
	const info = sinon.spy(Logger._winston, 'info');
	t.context.logger.replicants('replicants');
	t.is(info.called, false);
	info.restore();
});

test('Sentry - should log errors to Sentry when global.sentryEnabled is true', (t) => {
	t.context.sentryLogger.error('error message');
	t.true(t.context.SentryMock.captureException.calledOnce);
	t.true(t.context.SentryMock.captureException.firstCall.args[0] instanceof Error, 'first arg is Error');
	t.is(t.context.SentryMock.captureException.firstCall.args[0].message, '[sentryServer] error message');
});

test('Sentry - should prettyprint objects', (t) => {
	t.context.sentryLogger.error('error message:', { foo: { bar: 'baz' } });
	t.is(
		t.context.SentryMock.captureException.firstCall.args[0].message,
		"[sentryServer] error message: { foo: { bar: 'baz' } }",
	);
});
