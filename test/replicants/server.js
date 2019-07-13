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
const { initDashboard } = browser.setup();

import * as C from '../helpers/test-constants';

let dashboard;
test.before(async () => {
	dashboard = await initDashboard();
});

test.serial('should return a reference to any already-declared replicant', t => {
	const rep1 = t.context.apis.extension.Replicant('dupRef');
	const rep2 = t.context.apis.extension.Replicant('dupRef');
	t.is(rep1, rep2);
});

test.serial('should only apply defaultValue when first declared', async t => {
	await dashboard.evaluate(
		() =>
			new Promise(done => {
				const rep = window.dashboardApi.Replicant('extensionTest', {
					defaultValue: 'foo',
					persistent: false,
				});
				rep.on('declared', done);
			}),
	);

	const rep = t.context.apis.extension.Replicant('extensionTest', { defaultValue: 'bar' });
	t.is(rep.value, 'foo');
});

test.serial('should be readable without subscription, via readReplicant', t => {
	t.is(t.context.apis.extension.readReplicant('extensionTest'), 'foo');
});

test.serial('should throw an error when no name is provided', t => {
	const error = t.throws(() => {
		t.context.apis.extension.Replicant();
	});

	t.true(error.message.includes('Must supply a name when instantiating a Replicant'));
});

test.serial('should throw an error when no namespace is provided', t => {
	const originalName = t.context.apis.extension.bundleName;
	t.context.apis.extension.bundleName = undefined;
	const error = t.throws(() => {
		t.context.apis.extension.Replicant('name');
	});
	t.context.apis.extension.bundleName = originalName;
	t.true(error.message.includes('Must supply a namespace when instantiating a Replicant'));
});

test.serial('should not explode when schema is invalid', t => {
	t.notThrows(() => {
		t.context.apis.extension.Replicant('badSchema');
	});
});

test.serial('should be assignable via the ".value" property', t => {
	const rep = t.context.apis.extension.Replicant('extensionAssignmentTest', { persistent: false });
	rep.value = 'assignmentOK';
	t.is(rep.value, 'assignmentOK');
});

test.serial.cb('should react to changes in nested properties of objects', t => {
	t.plan(3);

	const rep = t.context.apis.extension.Replicant('extensionObjTest', {
		persistent: false,
		defaultValue: { a: { b: { c: 'c' } } },
	});

	rep.on('change', (newVal, oldVal, operations) => {
		if (newVal.a.b.c !== 'nestedChangeOK') {
			return;
		}

		t.deepEqual(oldVal, {a: {b: {c: 'c'}}});
		t.deepEqual(newVal, {a: {b: {c: 'nestedChangeOK'}}});
		t.deepEqual(operations, [{
			args: {
				newValue: {a: {b: {c: 'c'}}}
			},
			method: 'overwrite',
			path: '/'
		}, {
			args: {
				newValue: 'nestedChangeOK',
				prop: 'c'
			},
		]);
		t.end();
	});

	rep.value.a.b.c = 'nestedChangeOK';
});

test.serial('memoization', t => {
	t.is(t.context.apis.extension.Replicant('memoizationTest'), t.context.apis.extension.Replicant('memoizationTest'));
});

test.serial.cb('should only apply array splices from the client once', t => {
	t.plan(1);

	const serverRep = t.context.apis.extension.Replicant('clientDoubleApplyTest', {
		persistent: false,
		defaultValue: [],
	});

	dashboard
		.evaluate(
			() =>
				new Promise(resolve => {
					window.clientDoubleApplyTest = window.dashboardApi.Replicant('clientDoubleApplyTest');
					window.clientDoubleApplyTest.on('declared', () => {
						window.clientDoubleApplyTest.on('change', resolve);
					});
				}),
		)
		.then(() => {
			serverRep.on('change', newVal => {
				if (Array.isArray(newVal) && newVal[0] === 'test') {
					t.deepEqual(newVal, ['test']);
					t.end();
				}
			});
			dashboard.evaluate(() => window.clientDoubleApplyTest.value.push('test'));
		});
});

test.serial('should remove .once listeners when quickfired', t => {
	const rep = t.context.apis.extension.Replicant('serverRemoveOnceListener', {
		persistent: false,
	});

	rep.once('change', () => {});
	t.is(rep.listenerCount('change'), 0);
});

test.serial('should not override/quickfire .once for events other than "change"', t => {
	const rep = t.context.apis.extension.Replicant('serverNotOverrideOtherOnceListeners', {
		persistent: false,
	});

	rep.once('declared', () => {
		t.fail();
	});
	t.pass();
});

test.serial.cb('arrays - should support the "delete" operator', t => {
	t.plan(3);

	const rep = t.context.apis.extension.Replicant('serverArrayDelete', {
		persistent: false,
		defaultValue: ['foo', 'bar'],
	});

	rep.on('change', (newVal, oldVal, operations) => {
		if (operations && operations[1].method === 'delete') {
			t.deepEqual(newVal, [, 'bar']); // eslint-disable-line no-sparse-arrays
			t.deepEqual(oldVal, ['foo', 'bar']);
			t.deepEqual(operations, [{
				path: '/',
				method: 'overwrite',
				args: {
					newValue: ['foo', 'bar']
				}
			}, {
				args: {prop: '0'},
				path: '/',
				method: 'delete'
			}]);
			t.end();
		}
	});

	delete rep.value[0];
});

test.serial.cb('arrays - should react to changes', t => {
	t.plan(3);

	const rep = t.context.apis.extension.Replicant('extensionArrTest', {
		persistent: false,
		defaultValue: ['starting'],
	});

	rep.on('change', (newVal, oldVal, operations) => {
		if (!operations) {
			return;
		}

		t.deepEqual(oldVal, ['starting']);
		t.deepEqual(newVal, ['starting', 'arrPushOK']);
		t.deepEqual(operations, [{
			args: {
				newValue: ['starting']
			},
			path: '/',
			method: 'overwrite'
		}, {
			args: ['arrPushOK'],
			method: 'push',
			path: '/'
		}]);
		t.end();
	});

	rep.value.push('arrPushOK');
});

test.serial('objects - throw an error when an object is owned by multiple Replicants', t => {
	const rep1 = t.context.apis.extension.Replicant('multiOwner1');
	const rep2 = t.context.apis.extension.Replicant('multiOwner2');
	const bar = { bar: 'bar' };
	rep1.value = {};
	rep2.value = {};
	rep1.value.foo = bar;

	const error = t.throws(() => {
		rep2.value.foo = bar;
	});

	t.true(error.message.startsWith('This object belongs to another Replicant'));
});

test.serial('dates - should not throw an error', t => {
	t.notThrows(() => {
		t.context.apis.extension.Replicant('extensionDateTest', {
			defaultValue: new Date(),
		});
	});
});

test.serial('persistent - should load persisted values when they exist', t => {
	const rep = t.context.apis.extension.Replicant('extensionPersistence');
	t.is(rep.value, 'it work good!');
});

test.serial.cb('persistent - should persist assignment to disk', t => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant('extensionPersistence');
	rep.value = { nested: 'hey we assigned!' };
	setTimeout(() => {
		const replicantPath = path.join(C.replicantsRoot(), 'test-bundle/extensionPersistence.rep');
		fs.readFile(replicantPath, 'utf-8', (err, data) => {
			if (err) {
				throw err;
			}

			t.is(data, '{"nested":"hey we assigned!"}');
			t.end();
		});
	}, 10);
});

test.serial.cb('persistent - should persist changes to disk', t => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant('extensionPersistence');
	rep.value.nested = 'hey we changed!';
	setTimeout(() => {
		const replicantPath = path.join(C.replicantsRoot(), 'test-bundle/extensionPersistence.rep');
		fs.readFile(replicantPath, 'utf-8', (err, data) => {
			if (err) {
				throw err;
			}

			t.is(data, '{"nested":"hey we changed!"}');
			t.end();
		});
	}, 250); // Delay needs to be longer than the persistence interval.
});

test.serial.cb('persistent - should persist falsey values to disk', t => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant('extensionFalseyWrite');
	rep.value = 0;
	setTimeout(() => {
		const replicantPath = path.join(C.replicantsRoot(), 'test-bundle/extensionFalseyWrite.rep');
		fs.readFile(replicantPath, 'utf-8', (err, data) => {
			if (err) {
				throw err;
			}

			t.is(data, '0');
			t.end();
		});
	}, 10);
});

test.serial('persistent - should read falsey values from disk', t => {
	const rep = t.context.apis.extension.Replicant('extensionFalseyRead');
	t.is(rep.value, 0);
});

test.serial.cb('transient - should not write their value to disk', t => {
	t.plan(2);

	// Remove the file if it exists for some reason
	const replicantPath = path.join(C.replicantsRoot(), 'test-bundle/extensionTransience.rep');
	fs.unlink(replicantPath, err => {
		if (err && err.code !== 'ENOENT') {
			throw err;
		}

		const rep = t.context.apis.extension.Replicant('extensionTransience', { persistent: false });
		rep.value = 'o no';
		fs.readFile(replicantPath, err => {
			t.truthy(err);
			t.is(err.code, 'ENOENT');
			t.end();
		});
	});
});

test.serial('should return true when deleting a non-existing property', t => {
	const rep = t.context.apis.extension.Replicant('serverDeleteNonExistent', { defaultValue: {} });
	t.true(delete rep.value.nonExistent);
});

test.serial("test that one else path that's hard to hit", t => {
	const rep = t.context.apis.extension.Replicant('arrayWithoutSchemaSetHandler', { defaultValue: [] });
	rep.value[0] = true;
	t.pass();
});

test.serial('should leave the default value intact', t => {
	const defaultValue = { lorem: 'ipsum' };
	const rep = t.context.apis.extension.Replicant('defaultValueIntact', { defaultValue });

	t.is(rep.opts.defaultValue, defaultValue);
	t.not(rep.value, defaultValue);
});
