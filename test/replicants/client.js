'use strict';

// Native
import * as fs from 'fs';
import * as path from 'path';

// Packages
import test from 'ava';

// Ours
import * as server from '../helpers/server';
import * as browser from '../helpers/browser';

server.setup();
const {initDashboard} = browser.setup();

import * as C from '../helpers/test-constants';

let dashboard;
test.before(async () => {
	dashboard = await initDashboard();
});

test.serial('should return a reference to any already-declared replicant', async t => {
	const ret = await dashboard.evaluate(() => {
		const rep1 = window.dashboardApi.Replicant('clientDupRef');
		const rep2 = window.dashboardApi.Replicant('clientDupRef');
		return rep1 === rep2;
	});

	t.true(ret);
});

test.serial('should only apply defaultValue when first declared', async t => {
	t.context.apis.extension.Replicant('clientTest', {
		defaultValue: 'foo',
		persistent: false
	});

	const ret = await dashboard.evaluate(() => new Promise(resolve => {
		const rep = window.dashboardApi.Replicant('clientTest', {defaultValue: 'bar'});
		rep.on('declared', () => resolve(rep.value));
	}));

	t.is(ret, 'foo');
});

test.serial('should be readable without subscription, via readReplicant', async t => {
	t.context.apis.extension.Replicant('clientReadReplicentTest', {
		defaultValue: 'foo',
		persistent: false
	});

	const ret = await dashboard.evaluate(() => new Promise(resolve => {
		window.dashboardApi.readReplicant('clientReadReplicentTest', resolve);
	}));

	t.is(ret, 'foo');
});

test.serial('should throw an error when no name is provided', async t => {
	const ret = await dashboard.evaluate(() => new Promise(resolve => {
		try {
			window.dashboardApi.Replicant();
		} catch (e) {
			resolve(e.message);
		}
	}));

	t.is(ret, 'Must supply a name when instantiating a Replicant');
});

test.serial('should be assignable via the ".value" property', async t => {
	const ret = await dashboard.evaluate(() => new Promise(resolve => {
		const rep = window.dashboardApi.Replicant('clientAssignmentTest', {persistent: false});
		rep.on('change', newVal => {
			if (newVal === 'assignmentOK') {
				resolve({
					value: rep.value,
					revision: rep.revision
				});
			}
		});
		rep.value = 'assignmentOK';
	}));

	t.is(ret.value, 'assignmentOK');
	t.is(ret.revision, 1);
});

test.serial('should emit a "change" event after successful declaration when the value is undefined', async t => {
	const ret = await dashboard.evaluate(() => new Promise(resolve => {
		const rep = window.dashboardApi.Replicant('clientUndefinedChangeTest', {persistent: false});
		rep.on('change', () => {
			resolve({
				// Little hack to workaround the fact that `undefined` gets serialized to `null`.
				valueWasUndefined: rep.value === undefined,
				revision: rep.revision
			});
		});
	}));

	t.is(ret.valueWasUndefined, true);
	t.is(ret.revision, 0);
});

test.serial('should log a warning when attempting to access .value before the Replicant has finished declaring', async t => {
	const ret = await dashboard.evaluate(() => new Promise(resolve => {
		const rep = window.dashboardApi.Replicant('clientEarlyValueAccess', {persistent: false});

		// TODO: Replace this with sinon.
		const originalWarn = rep.log.warn;
		rep.log.warn = (...args) => {
			rep.log.warn = originalWarn;
			resolve(args);
		};

		const val = rep.value; // eslint-disable-line no-unused-vars
	}));

	t.is(ret[0], 'Attempted to get value before Replicant had finished declaring. ' +
		'This will always return undefined.');
});

test.serial('should remove .once listeners when quickfired', async t => {
	const ret = await dashboard.evaluate(() => new Promise(resolve => {
		const rep = window.dashboardApi.Replicant('clientRemoveOnceListener', {
			persistent: false
		});

		rep.once('declared', () => {
			rep.once('change', () => {});
			resolve(rep.listenerCount('change'));
		});
	}));

	t.is(ret, 0);
});

test.serial('when an array - should react to changes', async t => {
	const ret = await dashboard.evaluate(() => new Promise(resolve => {
		const rep = window.dashboardApi.Replicant('clientArrTest', {
			persistent: false,
			defaultValue: ['starting']
		});

		rep.on('declared', () => {
			rep.on('change', (newVal, oldVal, operations) => {
				if (newVal && oldVal && operations) {
					const res = {
						newVal: JSON.parse(JSON.stringify(newVal)),
						oldVal,
						operations
					};
					resolve(res);
				}
			});

			rep.value.push('arrPushOK');
		});
	}));

	t.deepEqual(ret.newVal, ['starting', 'arrPushOK']);
	t.deepEqual(ret.oldVal, ['starting']);
	t.deepEqual(ret.operations, [{
		args: ['arrPushOK'],
		path: '/',
		method: 'push',
		result: 2
	}]);
});

test.serial('when an array - should support the "delete" operator', async t => {
	const ret = await dashboard.evaluate(() => new Promise(resolve => {
		const rep = window.dashboardApi.Replicant('clientArrayDelete', {
			defaultValue: ['foo', 'bar'],
			persistent: false
		});

		rep.on('change', (newVal, oldVal, operations) => {
			if (newVal[0] === 'foo') {
				delete rep.value[0];
			} else if (newVal[0] === undefined) {
				const res = {
					newVal,
					oldVal,
					operations
				};
				resolve(JSON.parse(JSON.stringify(res)));
			}
		});
	}));

	// This ends up being "null" rather than a sparse array, because JSON doesn't handle sparse arrays.
	// If we really need it to, we can convert the array to an object before stringification, then convert back to an array.
	t.deepEqual(ret.newVal, [null, 'bar']);
	t.deepEqual(ret.oldVal, ['foo', 'bar']);
	t.deepEqual(ret.operations, [{
		args: {prop: '0'},
		path: '/',
		method: 'delete',
		result: true
	}]);
});

test.serial.cb('when an array - should proxy objects added to arrays via array insertion methods', t => {
	const rep = t.context.apis.extension.Replicant('serverArrInsertObj', {defaultValue: []});
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

test.serial.cb('when an object - should not cause server-side replicants to lose observation', t => {
	t.plan(2);
	setTimeout(() => {
		t.end('Timeout');
	}, 1000);

	const rep = t.context.apis.extension.Replicant('clientServerObservation', {
		defaultValue: {foo: 'foo'},
		persistent: false
	});

	dashboard.evaluate(() => new Promise(resolve => {
		let barred = false;
		const rep = window.dashboardApi.Replicant('clientServerObservation');
		rep.on('change', newVal => {
			if (newVal.foo === 'bar') {
				resolve(JSON.parse(JSON.stringify(newVal)));
			} else if (!barred) {
				barred = true;
				rep.value.foo = 'bar';
			}
		});
	})).then(ret => {
		t.deepEqual(ret, {foo: 'bar'});

		rep.on('change', newVal => {
			if (newVal.foo === 'baz') {
				t.pass();
				t.end();
			}
		});

		rep.value.foo = 'baz';
	}).catch(t.fail);
});

test.serial('when an object - should react to changes in nested properties', async t => {
	const ret = await dashboard.evaluate(() => new Promise(resolve => {
		const rep = window.dashboardApi.Replicant('clientObjTest', {
			persistent: false,
			defaultValue: {a: {b: {c: 'c'}}}
		});

		rep.on('declared', () => {
			rep.on('change', (newVal, oldVal, operations) => {
				if (newVal && oldVal && operations) {
					resolve({
						newVal: JSON.parse(JSON.stringify(newVal)),
						oldVal,
						operations
					});
				}
			});

			rep.value.a.b.c = 'nestedChangeOK';
		});
	}));

	t.deepEqual(ret.oldVal, {a: {b: {c: 'c'}}});
	t.deepEqual(ret.newVal, {a: {b: {c: 'nestedChangeOK'}}});
	t.deepEqual(ret.operations, [{
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
test.serial('when an object - should react to server-side changes of array properties', async t => {
	const serverRep = t.context.apis.extension.Replicant('s2c_nestedArrTest', {
		persistent: false,
		defaultValue: {
			arr: []
		}
	});

	/* eslint-disable camelcase */
	await dashboard.evaluate(() => new Promise(resolve => {
		window.s2c_nestedArrTest = window.dashboardApi.Replicant('s2c_nestedArrTest');
		window.s2c_nestedArrTest.on('declared', () => {
			resolve();

			window.s2c_nestedArrTest.on('change', (newVal, oldVal, operations) => {
				if (newVal && oldVal && operations) {
					window.s2c_nestedArrChange = JSON.parse(JSON.stringify({
						newVal,
						oldVal,
						operations
					}));
				}
			});
		});
	}));
	/* eslint-enable camelcase */

	serverRep.value.arr.push('test');

	const ret = await dashboard.waitForFunction(() => window.s2c_nestedArrChange, {timeout: 1000});
	const retJson = await ret.jsonValue();

	t.deepEqual(retJson.newVal, {arr: ['test']});
	t.deepEqual(retJson.oldVal, {arr: []});
	t.deepEqual(retJson.operations, [{
		args: ['test'],
		path: '/arr',
		method: 'push',
		result: 1
	}]);
});

test.serial('when an object - should support the "delete" operator', async t => {
	const ret = await dashboard.evaluate(() => new Promise(resolve => {
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
				resolve(JSON.parse(JSON.stringify({
					newVal,
					oldVal,
					operations
				})));
			}
		});
	}));

	t.deepEqual(ret.newVal, {bar: 'bar'});
	t.deepEqual(ret.oldVal, {
		foo: 'foo',
		bar: 'bar'
	});
	t.deepEqual(ret.operations, [{
		args: {prop: 'foo'},
		path: '/',
		method: 'delete',
		result: true
	}]);
});

test.serial.cb('when an object - should properly proxy new objects assigned to properties', t => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant('serverObjProp', {
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

test.serial('when a date - should emit the JSON value to clients', async t => {
	const date = new Date();

	t.context.apis.extension.Replicant('clientDateTest', {
		defaultValue: date,
		persistent: false
	});

	const ret = await dashboard.evaluate(() => new Promise(resolve => {
		window.dashboardApi.readReplicant('clientDateTest', resolve);
	}));

	t.is(ret, date.toJSON());
});

test.serial('persistent - should load persisted values when they exist', async t => {
	const ret = await dashboard.evaluate(() => new Promise(resolve => {
		const rep = window.dashboardApi.Replicant('clientPersistence');
		rep.on('change', () => resolve(rep.value));
	}));

	t.is(ret, 'it work good!');
});

test.serial.cb('persistent - should persist assignment to disk', t => {
	t.plan(1);

	dashboard.evaluate(() => new Promise(resolve => {
		const rep = window.dashboardApi.Replicant('clientPersistence');
		rep.value = {nested: 'hey we assigned!'};
		rep.on('change', newVal => {
			if (newVal.nested && newVal.nested === 'hey we assigned!') {
				resolve();
			}
		});
	})).then(() => {
		const replicantPath = path.join(C.replicantsRoot(), 'test-bundle/clientPersistence.rep');
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

	const serverRep = t.context.apis.extension.Replicant('clientChangePersistence', {defaultValue: {nested: ''}});
	(async () => {
		await dashboard.evaluate(() => new Promise(resolve => {
			window.clientChangePersistence = window.dashboardApi.Replicant('clientChangePersistence');
			window.clientChangePersistence.once('change', resolve);
		}));
		serverRep.on('change', newVal => {
			if (newVal.nested !== 'hey we changed!') {
				return;
			}

			// On a short timeout to give the Replicator time to write the new value to disk
			setTimeout(() => {
				const replicantPath = path.join(C.replicantsRoot(), 'test-bundle/clientChangePersistence.rep');
				const data = fs.readFileSync(replicantPath, 'utf-8');
				t.is(data, '{"nested":"hey we changed!"}');
				t.end();
			}, 10);
		});
		dashboard.evaluate(() => {
			window.clientChangePersistence.value.nested = 'hey we changed!';
		}).catch(t.fail);
	})();
});

test.serial.cb('persistent - should persist falsey values to disk', t => {
	t.plan(1);

	dashboard.evaluate(() => new Promise(resolve => {
		const rep = window.dashboardApi.Replicant('clientFalseyWrite');
		rep.value = 0;
		rep.on('change', newVal => {
			if (newVal === 0) {
				resolve();
			}
		});
	})).then(() => {
		const replicantPath = path.join(C.replicantsRoot(), 'test-bundle/clientFalseyWrite.rep');
		fs.readFile(replicantPath, 'utf-8', (err, data) => {
			if (err) {
				throw err;
			}

			t.is(data, '0');
			t.end();
		});
	}).catch(t.fail);
});

test.serial('persistent - should read falsey values from disk', async t => {
	const ret = await dashboard.evaluate(() => new Promise(resolve => {
		const rep = window.dashboardApi.Replicant('clientFalseyRead');
		rep.on('declared', () => resolve(rep.value));
	}));

	t.is(ret, 0);
});

test.serial.cb('transient - should not write their value to disk', t => {
	t.plan(2);

	const replicantPath = path.join(C.replicantsRoot(), 'test-bundle/clientTransience.rep');
	fs.unlink(replicantPath, err => {
		if (err && err.code !== 'ENOENT') {
			throw err;
		}

		dashboard.evaluate(() => new Promise(resolve => {
			const rep = window.dashboardApi.Replicant('clientTransience', {
				defaultValue: 'o no',
				persistent: false
			});

			rep.on('declared', () => resolve());
		})).then(() => {
			fs.readFile(replicantPath, err => {
				t.truthy(err);
				t.is(err.code, 'ENOENT');
				t.end();
			});
		}).catch(t.fail);
	});
});

test.serial('#waitForReplicants', async t => {
	await dashboard.evaluate(() => new Promise(resolve => {
		const rep1 = window.dashboardApi.Replicant('wfp1');
		const rep2 = window.dashboardApi.Replicant('wfp2');
		const rep3 = window.dashboardApi.Replicant('wfp3');
		/* eslint-disable no-undef */
		NodeCG.waitForReplicants(rep1, rep2, rep3).then(resolve);
		/* eslint-enable no-undef */
	}));

	t.pass();
});
