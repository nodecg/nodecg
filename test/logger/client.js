'use strict';

// Packages
const sinon = require('sinon');
const test = require('ava');

// Ours
const loggerFactory = require('../../lib/logger/browser');

// Start up the logger lib with defaults only
const Logger = loggerFactory();

test.beforeEach(t => {
	t.context.logger = new Logger('testClient');

	const RavenMock = {
		captureException: sinon.stub()
	};
	const RavenLogger = loggerFactory({
		console: {
			enabled: true
		}
	}, RavenMock);
	t.context.RavenMock = RavenMock;
	t.context.ravenLogger = new RavenLogger('sentryClient');
});

test('console - should default to being silent', t => {
	t.is(Logger._silent, true);
});

test('console - should default to level "info"', t => {
	t.is(Logger._level, 'info');
});

test('console - should change settings when reconfigured', t => {
	Logger.globalReconfigure({
		console: {
			enabled: true,
			level: 'debug'
		}
	});

	t.is(Logger._silent, false);
	t.is(Logger._level, 'debug');
});

test('replicant - should default to false', t => {
	t.is(Logger._shouldLogReplicants, false);
});

test('replicant - should do nothing when Logger._shouldLogReplicants is false', t => {
	sinon.spy(console, 'info');
	t.context.logger.replicants('replicants');
	t.is(console.info.called, false);
	console.info.restore();
});

test('replicant - should change settings when reconfigured', t => {
	Logger.globalReconfigure({
		replicants: true
	});

	t.is(Logger._shouldLogReplicants, true);
});

test('logging methods should all do nothing when _silent is true', t => {
	Logger._silent = true;
	Logger._level = 'trace';

	// Trace
	sinon.spy(console, 'info');
	t.context.logger.trace('trace');
	t.is(console.info.called, false);
	console.info.restore();

	// Debug
	sinon.spy(console, 'info');
	t.context.logger.debug('debug');
	t.is(console.info.called, false);
	console.info.restore();

	// Info
	sinon.spy(console, 'info');
	t.context.logger.info('info');
	t.is(console.info.called, false);
	console.info.restore();

	// Warn
	sinon.spy(console, 'warn');
	t.context.logger.warn('warn');
	t.is(console.warn.called, false);
	console.warn.restore();

	// Error
	sinon.spy(console, 'error');
	t.context.logger.error('error');
	t.is(console.error.called, false);
	console.error.restore();

	// Replicants
	sinon.spy(console, 'info');
	t.context.logger.replicants('replicants');
	t.is(console.info.called, false);
	console.info.restore();
});

test('logging methods should all do nothing when the log level is above them', t => {
	Logger._silent = false;
	Logger._level = '_infinite';

	// Trace
	sinon.spy(console, 'info');
	t.context.logger.trace('trace');
	t.is(console.info.called, false);
	console.info.restore();

	// Debug
	sinon.spy(console, 'info');
	t.context.logger.debug('debug');
	t.is(console.info.called, false);
	console.info.restore();

	// Info
	sinon.spy(console, 'info');
	t.context.logger.info('info');
	t.is(console.info.called, false);
	console.info.restore();

	// Warn
	sinon.spy(console, 'warn');
	t.context.logger.warn('warn');
	t.is(console.warn.called, false);
	console.warn.restore();

	// Error
	sinon.spy(console, 'error');
	t.context.logger.error('error');
	t.is(console.error.called, false);
	console.error.restore();
});

test('logging methods should all prepend the instance name to the output', t => {
	Logger._level = 'trace';
	Logger._silent = false;

	// Trace
	sinon.spy(console, 'info');
	t.context.logger.trace('trace');
	t.deepEqual(console.info.getCall(0).args, ['[testClient]', 'trace']);
	console.info.restore();

	// Debug
	sinon.spy(console, 'info');
	t.context.logger.debug('debug');
	t.deepEqual(console.info.getCall(0).args, ['[testClient]', 'debug']);
	console.info.restore();

	// Info
	sinon.spy(console, 'info');
	t.context.logger.info('info');
	t.deepEqual(console.info.getCall(0).args, ['[testClient]', 'info']);
	console.info.restore();

	// Warn
	sinon.spy(console, 'warn');
	t.context.logger.warn('warn');
	t.deepEqual(console.warn.getCall(0).args, ['[testClient]', 'warn']);
	console.warn.restore();

	// Error
	sinon.spy(console, 'error');
	t.context.logger.error('error');
	t.deepEqual(console.error.getCall(0).args, ['[testClient]', 'error']);
	console.error.restore();

	// Replicants
	sinon.spy(console, 'info');
	t.context.logger.replicants('replicants');
	t.deepEqual(console.info.getCall(0).args, ['[testClient]', 'replicants']);
	console.info.restore();
});

test('Sentry - should log errors to Sentry when global.sentryEnabled is true', t => {
	t.context.ravenLogger.error('error message');
	t.true(t.context.RavenMock.captureException.calledOnce);
	t.true(t.context.RavenMock.captureException.firstCall.args[0] instanceof Error, 'first arg is Error');
	t.is(t.context.RavenMock.captureException.firstCall.args[0].message, '[sentryClient] error message');
	t.deepEqual(t.context.RavenMock.captureException.firstCall.args[1], {
		logger: 'client @nodecg/logger'
	});
});

test('Sentry - should prettyprint objects', t => {
	t.context.ravenLogger.error('error message:', {foo: {bar: 'baz'}});
	t.is(
		t.context.RavenMock.captureException.firstCall.args[0].message,
		'[sentryClient] error message: { foo: { bar: \'baz\' } }'
	);
});
