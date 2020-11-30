'use strict';

// Native
const fs = require('fs');

// Packages
const winston = require('winston');
const rimraf = require('rimraf');
const sinon = require('sinon');
const test = require('ava');

// Ours
const loggerFactory = require('../../lib/logger/server');

// Start up the logger lib with defaults only
const Logger = loggerFactory();

test.before(() => {
	// Remove the "logs" folder
	if (fs.existsSync('./logs')) {
		rimraf.sync('./logs');
	}
});

test.beforeEach(t => {
	t.context.logger = new Logger('testServer');

	const RavenMock = {
		captureException: sinon.stub()
	};
	const RavenLogger = loggerFactory({}, RavenMock);
	t.context.RavenMock = RavenMock;
	t.context.ravenLogger = new RavenLogger('sentryServer');
});

test('console - should default to being silent', t => {
	const consoleTransport = Logger._winston.transports.find(
		transport => transport instanceof winston.transports.Console
	);

	t.is(consoleTransport.silent, true);
});

test('console - should default to level "info"', t => {
	const consoleTransport = Logger._winston.transports.find(
		transport => transport instanceof winston.transports.Console
	);

	t.is(consoleTransport.level, 'info');
});

test('console - should change settings when reconfigured', t => {
	Logger.globalReconfigure({
		console: {
			enabled: true,
			level: 'debug'
		}
	});

	const consoleTransport = Logger._winston.transports.find(
		transport => transport instanceof winston.transports.Console
	);

	t.is(consoleTransport.silent, false);
	t.is(consoleTransport.level, 'debug');
});

test('file - should default to being silent', t => {
	const fileTransport = Logger._winston.transports.find(
		transport => transport instanceof winston.transports.File
	);

	t.is(fileTransport.silent, true);
});

test('file - should default to level "info"', t => {
	const fileTransport = Logger._winston.transports.find(
		transport => transport instanceof winston.transports.File
	);

	t.is(fileTransport.level, 'info');
});

test('file - should change settings when reconfigured', t => {
	Logger.globalReconfigure({
		file: {
			path: 'logs/test.log',
			enabled: true,
			level: 'debug'
		}
	});

	const fileTransport = Logger._winston.transports.find(
		transport => transport instanceof winston.transports.File
	);

	t.is(fileTransport.filename, 'logs/test.log');
	t.is(fileTransport.silent, false);
	t.is(fileTransport.level, 'debug');
});

test('file - should make the logs folder', t => {
	t.is(fs.existsSync('./logs'), true);
});

test('replicant - should default to false', t => {
	t.is(Logger._shouldLogReplicants, false);
});

test('replicant - should do nothing when Logger._shouldLogReplicants is false', t => {
	sinon.spy(Logger._winston, 'info');
	t.context.logger.replicants('replicants');
	t.is(Logger._winston.info.called, false);
	Logger._winston.info.restore();
});

test('replicant - should change settings when reconfigured', t => {
	Logger.globalReconfigure({
		replicants: true
	});

	t.is(Logger._shouldLogReplicants, true);
});

test('logging methods should all prepend the instance name to the output', t => {
	['trace', 'debug', 'info', 'warn', 'error'].forEach(level => {
		sinon.spy(Logger._winston, level);
		t.context.logger[level](level);
		t.deepEqual(Logger._winston[level].getCall(0).args, [`[testServer] ${level}`]);
		Logger._winston[level].restore();
	});

	// Replicants has to be tested differently than the others
	sinon.spy(Logger._winston, 'info');
	t.context.logger.replicants('replicants');
	t.deepEqual(Logger._winston.info.getCall(0).args, ['[testServer] replicants']);
	Logger._winston.info.restore();
});

test('logging methods should not generate any output when too low a level', t => {
	Logger.globalReconfigure({
		console: {
			enabled: true,
			level: 'error'
		}
	});

	sinon.spy(process.stdout, 'write');
	t.context.logger.trace('warning');
	t.is(process.stdout.write.called, false);
	process.stdout.write.restore();
});

test('logging methods should generate any output when of an adequate level', t => {
	Logger.globalReconfigure({
		console: {
			enabled: true,
			level: 'trace'
		}
	});

	sinon.spy(process.stdout, 'write');
	t.context.logger.trace('info');
	t.true(process.stdout.write.getCall(0).args[0].startsWith('\u001b[32mtrace\u001b[39m: [testServer] info'));
	process.stdout.write.restore();
});

test('Sentry - should log errors to Sentry when global.sentryEnabled is true', t => {
	t.context.ravenLogger.error('error message');
	t.true(t.context.RavenMock.captureException.calledOnce);
	t.true(t.context.RavenMock.captureException.firstCall.args[0] instanceof Error, 'first arg is Error');
	t.is(t.context.RavenMock.captureException.firstCall.args[0].message, '[sentryServer] error message');
	t.deepEqual(t.context.RavenMock.captureException.firstCall.args[1], {
		logger: 'server @nodecg/logger'
	});
});

test('Sentry - should prettyprint objects', t => {
	t.context.ravenLogger.error('error message:', {foo: {bar: 'baz'}});
	t.is(
		t.context.RavenMock.captureException.firstCall.args[0].message,
		'[sentryServer] error message: { foo: { bar: \'baz\' } }'
	);
});
