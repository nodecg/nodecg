'use strict';

// Packages
const fs = require('fs');
const path = require('path');
const test = require('ava');

// Ours
require('../helpers/nodecg-and-webdriver')(test, ['dashboard']); // Must be first.
const e = require('../helpers/test-environment');
const C = require('../helpers/test-constants');

test.beforeEach(() => {
	return e.browser.client.switchTab(e.browser.tabs.dashboard);
});

test('should return a reference to any already-declared replicant', async t => {
	const ret = await e.browser.client.execute(() => {
		const rep1 = window.dashboardApi.Replicant('clientDupRef');
		const rep2 = window.dashboardApi.Replicant('clientDupRef');
		return rep1 === rep2;
	});

	t.true(ret.value);
});

test('should only apply defaultValue when first declared', async t => {
	e.apis.extension.Replicant('clientTest', {
		defaultValue: 'foo',
		persistent: false
	});

	const ret = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('clientTest', {defaultValue: 'bar'});
		rep.on('declared', () => done(rep.value));
	});

	t.is(ret.value, 'foo');
});

test('should be readable without subscription, via readReplicant', async t => {
	e.apis.extension.Replicant('clientReadReplicentTest', {
		defaultValue: 'foo',
		persistent: false
	});

	const ret = await e.browser.client.executeAsync(done => {
		window.dashboardApi.readReplicant('clientReadReplicentTest', done);
	});

	t.is(ret.value, 'foo');
});

test('should throw an error when no name is provided', async t => {
	const ret = await e.browser.client.executeAsync(done => {
		try {
			window.dashboardApi.Replicant();
		} catch (e) {
			done(e.message);
		}
	});

	t.is(ret.value, 'Must supply a name when instantiating a Replicant');
});

test('should be assignable via the ".value" property', async t => {
	const ret = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('clientAssignmentTest', {persistent: false});
		rep.on('change', newVal => {
			if (newVal === 'assignmentOK') {
				done({
					value: rep.value,
					revision: rep.revision
				});
			}
		});
		rep.value = 'assignmentOK';
	});

	t.is(ret.value.value, 'assignmentOK');
	t.is(ret.value.revision, 1);
});

test('should emit a "change" event after successful declaration when the value is undefined', async t => {
	const ret = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('clientUndefinedChangeTest', {persistent: false});
		rep.on('change', () => {
			done({
				// Little hack to workaround the fact that `undefined` gets serialized to `null`.
				valueWasUndefined: rep.value === undefined,
				revision: rep.revision
			});
		});
	});

	t.is(ret.value.valueWasUndefined, true);
	t.is(ret.value.revision, 0);
});

test('should log a warning when attempting to access .value before the Replicant has finished declaring', async t => {
	const ret = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('clientEarlyValueAccess', {persistent: false});

		// TODO: Replace this with sinon.
		const originalWarn = rep.log.warn;
		rep.log.warn = function () {
			rep.log.warn = originalWarn;
			done(arguments);
		};

		const val = rep.value; // eslint-disable-line no-unused-vars
	});

	t.is(ret.value[0], 'Attempted to get value before Replicant had finished declaring. ' +
		'This will always return undefined.');
});

test('should remove .once listeners when quickfired', async t => {
	const ret = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('clientRemoveOnceListener', {
			persistent: false
		});

		rep.once('declared', () => {
			rep.once('change', () => {});
			done(rep.listenerCount('change'));
		});
	});

	t.is(ret.value, 0);
});

test('when an array - should react to changes', async t => {
	const ret = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('clientArrTest', {
			persistent: false,
			defaultValue: ['starting']
		});

		rep.on('declared', () => {
			rep.on('change', (newVal, oldVal, operations) => {
				if (newVal && oldVal && operations) {
					done({
						newVal,
						oldVal,
						operations
					});
				}
			});

			rep.value.push('arrPushOK');
		});
	});

	t.deepEqual(ret.value.newVal, ['starting', 'arrPushOK']);
	t.deepEqual(ret.value.oldVal, ['starting']);
	t.deepEqual(ret.value.operations, [{
		args: ['arrPushOK'],
		path: '/',
		method: 'push',
		result: 2
	}]);
});

test('when an array - should support the "delete" operator', async t => {
	const ret = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('clientArrayDelete', {
			defaultValue: ['foo', 'bar'],
			persistent: false
		});

		rep.on('change', (newVal, oldVal, operations) => {
			if (newVal[0] === 'foo') {
				delete rep.value[0];
			} else if (newVal[0] === undefined) {
				done({
					newVal,
					oldVal,
					operations
				});
			}
		});
	});

	// This ends up being "null" rather than a sparse array, because JSON doesn't handle sparse arrays.
	// If we really need it to, we can convert the array to an object before stringification, then convert back to an array.
	t.deepEqual(ret.value.newVal, [null, 'bar']);
	t.deepEqual(ret.value.oldVal, ['foo', 'bar']);
	t.deepEqual(ret.value.operations, [{
		args: {prop: '0'},
		path: '/',
		method: 'delete',
		result: true
	}]);
});

test.cb('when an array - should proxy objects added to arrays via array insertion methods', t => {
	const rep = e.apis.extension.Replicant('serverArrInsertObj', {defaultValue: []});
	rep.value.push({foo: 'foo'});
	rep.on('change', newVal => {
		if (newVal[0].foo === 'bar') {
			t.deepEqual(newVal, [{foo: 'bar'}]);
			t.end();
		}
	});

	process.nextTick(() => {
		rep.value[0].foo = 'bar';
	});
});

test.cb('when an object - should not cause server-side replicants to lose observation', t => {
	t.plan(2);

	const rep = e.apis.extension.Replicant('clientServerObservation', {
		defaultValue: {foo: 'foo'},
		persistent: false
	});

	e.browser.client.executeAsync(done => {
		let barred = false;
		const rep = window.dashboardApi.Replicant('clientServerObservation');
		rep.on('change', newVal => {
			if (newVal.foo === 'bar') {
				done(newVal);
			} else if (!barred) {
				barred = true;
				rep.value.foo = 'bar';
			}
		});
	}).then(ret => {
		t.deepEqual(ret.value, {foo: 'bar'});

		rep.on('change', newVal => {
			if (newVal.foo === 'baz') {
				t.pass();
				t.end();
			}
		});

		rep.value.foo = 'baz';
	}).catch(t.fail);
});

test('when an object - should react to changes in nested properties', async t => {
	const ret = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('clientObjTest', {
			persistent: false,
			defaultValue: {a: {b: {c: 'c'}}}
		});

		rep.on('declared', () => {
			rep.on('change', (newVal, oldVal, operations) => {
				if (newVal && oldVal && operations) {
					done({
						newVal,
						oldVal,
						operations
					});
				}
			});

			rep.value.a.b.c = 'nestedChangeOK';
		});
	});

	t.deepEqual(ret.value.oldVal, {a: {b: {c: 'c'}}});
	t.deepEqual(ret.value.newVal, {a: {b: {c: 'nestedChangeOK'}}});
	t.deepEqual(ret.value.operations, [{
		args: {
			newValue: 'nestedChangeOK',
			prop: 'c'
		},
		path: '/a/b',
		method: 'update',
		result: 'c'
	}]);
});

// This specifically tests the following case:
// When the server has a replicant with an array nested inside an object, and that array changes,
// the server should detect that change event, emit it to all clients,
// and the clients should then digest that change and emit a "change" event.
// This test is to address a very specific bug reported by Love Olsson.
test('when an object - should react to server-side changes of array properties', async t => {
	const serverRep = e.apis.extension.Replicant('s2c_nestedArrTest', {
		persistent: false,
		defaultValue: {
			arr: []
		}
	});

	/* eslint-disable camelcase */
	await e.browser.client.executeAsync(done => {
		window.s2c_nestedArrTest = window.dashboardApi.Replicant('s2c_nestedArrTest');
		window.s2c_nestedArrTest.on('declared', () => {
			done();

			window.s2c_nestedArrTest.on('change', (newVal, oldVal, operations) => {
				if (newVal && oldVal && operations) {
					window.s2c_nestedArrChange = {
						newVal,
						oldVal,
						operations
					};
				}
			});
		});
	});
	/* eslint-enable camelcase */

	serverRep.value.arr.push('test');

	const ret = await e.browser.client.executeAsync(done => {
		const interval = setInterval(() => {
			if (window.s2c_nestedArrChange) {
				clearInterval(interval);
				done(window.s2c_nestedArrChange);
			}
		}, 50);
	});

	t.deepEqual(ret.value.newVal, {arr: ['test']});
	t.deepEqual(ret.value.oldVal, {arr: []});
	t.deepEqual(ret.value.operations, [{
		args: ['test'],
		path: '/arr',
		method: 'push',
		result: 1
	}]);
});

test('when an object - should support the "delete" operator', async t => {
	const ret = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('clientObjectDelete', {
			defaultValue: {
				foo: 'foo',
				bar: 'bar'
			},
			persistent: false
		});

		rep.on('change', (newVal, oldVal, operations) => {
			if (newVal.foo) {
				delete rep.value.foo;
			} else if (newVal.bar) {
				done({
					newVal,
					oldVal,
					operations
				});
			}
		});
	});

	t.deepEqual(ret.value.newVal, {bar: 'bar'});
	t.deepEqual(ret.value.oldVal, {
		foo: 'foo',
		bar: 'bar'
	});
	t.deepEqual(ret.value.operations, [{
		args: {prop: 'foo'},
		path: '/',
		method: 'delete',
		result: true
	}]);
});

test.cb('when an object - should properly proxy new objects assigned to properties', t => {
	t.plan(1);

	const rep = e.apis.extension.Replicant('serverObjProp', {
		defaultValue: {foo: {bar: 'bar'}}
	});

	rep.value.foo = {baz: 'baz'};

	rep.on('change', newVal => {
		if (newVal.foo.baz === 'bax') {
			t.is(newVal.foo.baz, 'bax');
			t.end();
		}
	});

	process.nextTick(() => {
		rep.value.foo.baz = 'bax';
	});
});

test.serial('persistent - should load persisted values when they exist', async t => {
	const ret = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('clientPersistence');
		rep.on('change', () => done(rep.value));
	});

	t.is(ret.value, 'it work good!');
});

test.serial.cb('persistent - should persist assignment to disk', t => {
	t.plan(1);

	e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('clientPersistence');
		rep.value = {nested: 'hey we assigned!'};
		rep.on('change', newVal => {
			if (newVal.nested && newVal.nested === 'hey we assigned!') {
				done();
			}
		});
	}).then(() => {
		const replicantPath = path.join(C.REPLICANTS_ROOT, 'test-bundle/clientPersistence.rep');
		fs.readFile(replicantPath, 'utf-8', (err, data) => {
			if (err) {
				throw err;
			}

			t.is(data, '{"nested":"hey we assigned!"}');
			t.end();
		});
	}).catch(t.fail);
});

test.cb('persistent - should persist changes to disk', t => {
	t.plan(1);

	const serverRep = e.apis.extension.Replicant('clientChangePersistence', {defaultValue: {nested: ''}});
	e.browser.client.executeAsync(done => {
		window.clientChangePersistence = window.dashboardApi.Replicant('clientChangePersistence');
		window.clientChangePersistence.once('change', () => done());
	}).then(() => {
		serverRep.on('change', newVal => {
			if (newVal.nested !== 'hey we changed!') {
				return;
			}

			// On a short timeout to give the Replicator time to write the new value to disk
			setTimeout(() => {
				const replicantPath = path.join(C.REPLICANTS_ROOT, 'test-bundle/clientChangePersistence.rep');
				const data = fs.readFileSync(replicantPath, 'utf-8');
				t.is(data, '{"nested":"hey we changed!"}');
				t.end();
			}, 10);
		});
	}).execute(() => {
		window.clientChangePersistence.value.nested = 'hey we changed!';
	}).catch(t.fail);
});

test.cb('persistent - should persist falsey values to disk', t => {
	t.plan(1);

	e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('clientFalseyWrite');
		rep.value = 0;
		rep.on('change', newVal => {
			if (newVal === 0) {
				done();
			}
		});
	}).then(() => {
		const replicantPath = path.join(C.REPLICANTS_ROOT, 'test-bundle/clientFalseyWrite.rep');
		fs.readFile(replicantPath, 'utf-8', (err, data) => {
			if (err) {
				throw err;
			}

			t.is(data, '0');
			t.end();
		});
	}).catch(t.fail);
});

test('persistent - should read falsey values from disk', async t => {
	const ret = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('clientFalseyRead');
		rep.on('declared', () => done(rep.value));
	});

	t.is(ret.value, 0);
});

test.cb('transient - should not write their value to disk', t => {
	t.plan(2);

	const replicantPath = path.join(C.REPLICANTS_ROOT, 'test-bundle/clientTransience.rep');
	fs.unlink(replicantPath, err => {
		if (err && err.code !== 'ENOENT') {
			throw err;
		}

		e.browser.client.executeAsync(done => {
			const rep = window.dashboardApi.Replicant('clientTransience', {
				defaultValue: 'o no',
				persistent: false
			});

			rep.on('declared', () => done());
		}).then(() => {
			fs.readFile(replicantPath, err => {
				t.truthy(err);
				t.is(err.code, 'ENOENT');
				t.end();
			});
		}).catch(t.fail);
	});
});
