'use strict';

// Packages
const fs = require('fs');
const path = require('path');
const test = require('ava');

// Ours
require('../helpers/nodecg-and-webdriver')(test, ['dashboard']); // Must be first.
const e = require('../helpers/test-environment');
const C = require('../helpers/test-constants');

test('should return a reference to any already-declared replicant', t => {
	const rep1 = e.apis.extension.Replicant('dupRef');
	const rep2 = e.apis.extension.Replicant('dupRef');
	t.is(rep1, rep2);
});

test.serial('should only apply defaultValue when first declared', async t => {
	await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('extensionTest', {
			defaultValue: 'foo',
			persistent: false
		});
		rep.on('declared', () => done());
	});

	const rep = e.apis.extension.Replicant('extensionTest', {defaultValue: 'bar'});
	t.is(rep.value, 'foo');
});

test.serial('should be readable without subscription, via readReplicant', t => {
	t.is(e.apis.extension.readReplicant('extensionTest'), 'foo');
});

test('should throw an error when no name is provided', t => {
	const error = t.throws(() => {
		e.apis.extension.Replicant();
	});

	t.true(error.message.includes('Must supply a name when instantiating a Replicant'));
});

test('should be assignable via the ".value" property', t => {
	const rep = e.apis.extension.Replicant('extensionAssignmentTest', {persistent: false});
	rep.value = 'assignmentOK';
	t.is(rep.value, 'assignmentOK');
});

test.cb('should react to changes in nested properties of objects', t => {
	t.plan(3);

	const rep = e.apis.extension.Replicant('extensionObjTest', {
		persistent: false,
		defaultValue: {a: {b: {c: 'c'}}}
	});

	rep.on('change', (newVal, oldVal, operations) => {
		if (newVal.a.b.c !== 'nestedChangeOK') {
			return;
		}

		t.deepEqual(oldVal, {a: {b: {c: 'c'}}});
		t.deepEqual(newVal, {a: {b: {c: 'nestedChangeOK'}}});
		t.deepEqual(operations, [{
			args: {
				newValue: 'nestedChangeOK',
				prop: 'c'
			},
			method: 'update',
			path: '/a/b'
		}]);
		t.end();
	});

	rep.value.a.b.c = 'nestedChangeOK';
});

test('memoization', t => {
	t.is(
		e.apis.extension.Replicant('memoizationTest'),
		e.apis.extension.Replicant('memoizationTest')
	);
});

test.cb('should only apply array splices from the client once', t => {
	t.plan(1);

	const serverRep = e.apis.extension.Replicant('clientDoubleApplyTest', {
		persistent: false,
		defaultValue: []
	});

	e.browser.client
		.executeAsync(done => {
			window.clientDoubleApplyTest = window.dashboardApi.Replicant('clientDoubleApplyTest');
			window.clientDoubleApplyTest.on('declared', () => {
				window.clientDoubleApplyTest.on('change', () => done());
			});
		})
		.then(() => {
			serverRep.on('change', newVal => {
				if (Array.isArray(newVal) && newVal[0] === 'test') {
					t.deepEqual(newVal, ['test']);
					t.end();
				}
			});
		})
		.execute(() => window.clientDoubleApplyTest.value.push('test'))
		.catch(t.fail);
});

test('should remove .once listeners when quickfired', t => {
	const rep = e.apis.extension.Replicant('serverRemoveOnceListener', {
		persistent: false
	});

	rep.once('change', () => {});
	t.is(rep.listenerCount('change'), 0);
});

test.cb('arrays - should support the "delete" operator', t => {
	t.plan(3);

	const rep = e.apis.extension.Replicant('serverArrayDelete', {
		persistent: false,
		defaultValue: ['foo', 'bar']
	});

	rep.on('change', (newVal, oldVal, operations) => {
		if (operations && operations[0].method === 'delete') {
			t.deepEqual(newVal, [, 'bar']); // eslint-disable-line no-sparse-arrays
			t.deepEqual(oldVal, ['foo', 'bar']);
			t.deepEqual(operations, [{
				args: {prop: '0'},
				path: '/',
				method: 'delete'
			}]);
			t.end();
		}
	});

	delete rep.value[0];
});

test.cb('arrays - should react to changes', t => {
	t.plan(3);

	const rep = e.apis.extension.Replicant('extensionArrTest', {
		persistent: false,
		defaultValue: ['starting']
	});

	rep.on('change', (newVal, oldVal, operations) => {
		if (!operations) {
			return;
		}

		t.deepEqual(oldVal, ['starting']);
		t.deepEqual(newVal, ['starting', 'arrPushOK']);
		t.deepEqual(operations, [{
			args: ['arrPushOK'],
			method: 'push',
			path: '/'
		}]);
		t.end();
	});

	rep.value.push('arrPushOK');
});

test('objects - throw an error when an object is owned by multiple Replicants', t => {
	const rep1 = e.apis.extension.Replicant('multiOwner1');
	const rep2 = e.apis.extension.Replicant('multiOwner2');
	const bar = {bar: 'bar'};
	rep1.value = {};
	rep2.value = {};
	rep1.value.foo = bar;

	const error = t.throws(() => {
		rep2.value.foo = bar;
	});

	t.true(error.message.startsWith('This object belongs to another Replicant'));
});

test.serial('persistent - should load persisted values when they exist', t => {
	const rep = e.apis.extension.Replicant('extensionPersistence');
	t.is(rep.value, 'it work good!');
});

test.cb.serial('persistent - should persist assignment to disk', t => {
	t.plan(1);

	const rep = e.apis.extension.Replicant('extensionPersistence');
	rep.value = {nested: 'hey we assigned!'};
	setTimeout(() => {
		const replicantPath = path.join(C.REPLICANTS_ROOT, 'test-bundle/extensionPersistence.rep');
		fs.readFile(replicantPath, 'utf-8', (err, data) => {
			if (err) {
				throw err;
			}

			t.is(data, '{"nested":"hey we assigned!"}');
			t.end();
		});
	}, 10);
});

test.cb.serial('persistent - should persist changes to disk', t => {
	t.plan(1);

	const rep = e.apis.extension.Replicant('extensionPersistence');
	rep.value.nested = 'hey we changed!';
	setTimeout(() => {
		const replicantPath = path.join(C.REPLICANTS_ROOT, 'test-bundle/extensionPersistence.rep');
		fs.readFile(replicantPath, 'utf-8', (err, data) => {
			if (err) {
				throw err;
			}

			t.is(data, '{"nested":"hey we changed!"}');
			t.end();
		});
	}, 10);
});

test.cb('persistent - should persist falsey values to disk', t => {
	t.plan(1);

	const rep = e.apis.extension.Replicant('extensionFalseyWrite');
	rep.value = 0;
	setTimeout(() => {
		const replicantPath = path.join(C.REPLICANTS_ROOT, 'test-bundle/extensionFalseyWrite.rep');
		fs.readFile(replicantPath, 'utf-8', (err, data) => {
			if (err) {
				throw err;
			}

			t.is(data, '0');
			t.end();
		});
	}, 10);
});

test('persistent - should read falsey values from disk', t => {
	const rep = e.apis.extension.Replicant('extensionFalseyRead');
	t.is(rep.value, 0);
});

test.cb('transient - should not write their value to disk', t => {
	t.plan(2);

	// Remove the file if it exists for some reason
	const replicantPath = path.join(C.REPLICANTS_ROOT, 'test-bundle/extensionTransience.rep');
	fs.unlink(replicantPath, err => {
		if (err && err.code !== 'ENOENT') {
			throw err;
		}

		const rep = e.apis.extension.Replicant('extensionTransience', {persistent: false});
		rep.value = 'o no';
		fs.readFile(replicantPath, err => {
			t.truthy(err);
			t.is(err.code, 'ENOENT');
			t.end();
		});
	});
});
