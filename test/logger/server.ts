// Packages
import fs from 'fs-extra';
import sinon from 'sinon';
import anyTest, { TestInterface } from 'ava';

// Ours
import loggerFactory from '../../src/server/logger/logger.server';

// Start up the logger lib with defaults only
const Logger = loggerFactory();

type TestContext = {
	logger: InstanceType<typeof Logger>;
	SentryMock: any;
	sentryLogger: InstanceType<typeof Logger>;
};

const test = anyTest as TestInterface<TestContext>;

test.before(() => {
	// Remove the "logs" folder
	if (fs.existsSync('./logs')) {
		fs.removeSync('./logs');
	}
});

test.beforeEach(t => {
	t.context.logger = new Logger('testServer');

	const SentryMock: any = {
		captureException: sinon.stub(),
	};
	const sentryLogger = loggerFactory({}, SentryMock);
	t.context.SentryMock = SentryMock;
	t.context.sentryLogger = new sentryLogger('sentryServer');
});

test('console - should default to being silent', t => {
	t.is(Logger._winston.transports.nodecgConsole.silent, true);
});

test('console - should default to level "info"', t => {
	t.is(Logger._winston.transports.nodecgConsole.level, 'info');
});

test('file - should default to being silent', t => {
	t.is(Logger._winston.transports.nodecgFile.silent, true);
});

test('file - should default to level "info"', t => {
	t.is(Logger._winston.transports.nodecgFile.level, 'info');
});

test('file - should make the logs folder', t => {
	t.is(fs.existsSync('./logs'), true);
});

test('replicant - should default to false', t => {
	t.is(Logger._shouldLogReplicants, false);
});

test('replicant - should do nothing when Logger._shouldLogReplicants is false', t => {
	const info = sinon.spy(Logger._winston, 'info');
	t.context.logger.replicants('replicants');
	t.is(info.called, false);
	info.restore();
});

test('Sentry - should log errors to Sentry when global.sentryEnabled is true', t => {
	t.context.sentryLogger.error('error message');
	t.true(t.context.SentryMock.captureException.calledOnce);
	t.true(t.context.SentryMock.captureException.firstCall.args[0] instanceof Error, 'first arg is Error');
	t.is(t.context.SentryMock.captureException.firstCall.args[0].message, '[sentryServer] error message');
});

test('Sentry - should prettyprint objects', t => {
	t.context.sentryLogger.error('error message:', { foo: { bar: 'baz' } });
	t.is(
		t.context.SentryMock.captureException.firstCall.args[0].message,
		"[sentryServer] error message: { foo: { bar: 'baz' } }",
	);
});
