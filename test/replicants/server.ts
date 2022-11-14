// Native
import fs from 'fs';
import path from 'path';

// Packages
import type { TestInterface } from 'ava';
import anyTest from 'ava';
import type puppeteer from 'puppeteer';

// Ours
import * as server from '../helpers/server';
import * as browser from '../helpers/browser';

const test = anyTest as TestInterface<browser.BrowserContext & server.ServerContext>;
server.setup();
const { initDashboard } = browser.setup();

import * as C from '../helpers/test-constants';

let dashboard: puppeteer.Page;
test.before(async () => {
	dashboard = await initDashboard();
});

test.serial('should return a reference to any already-declared replicant', (t) => {
	const rep1 = t.context.apis.extension.Replicant('dupRef');
	const rep2 = t.context.apis.extension.Replicant('dupRef');
	t.is(rep1, rep2);
});

test.serial('should only apply defaultValue when first declared', async (t) => {
	await dashboard.evaluate(
		async () =>
			new Promise((done) => {
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

test.serial('should be readable without subscription, via readReplicant', (t) => {
	t.is(t.context.apis.extension.readReplicant('extensionTest'), 'foo');
});

test.serial('should throw an error when no name is provided', (t) => {
	const error = t.throws(() => {
		// @ts-expect-error
		t.context.apis.extension.Replicant();
	});

	t.true(error.message.includes('Must supply a name when instantiating a Replicant'));
});

test.serial('should not explode when schema is invalid', (t) => {
	t.notThrows(() => {
		t.context.apis.extension.Replicant('badSchema');
	});
});

test.serial('should be assignable via the ".value" property', (t) => {
	const rep = t.context.apis.extension.Replicant('extensionAssignmentTest', { persistent: false });
	rep.value = 'assignmentOK';
	t.is(rep.value, 'assignmentOK');
});

test.serial.cb('should react to changes in nested properties of objects', (t) => {
	t.plan(3);

	const rep = t.context.apis.extension.Replicant('extensionObjTest', {
		persistent: false,
		defaultValue: { a: { b: { c: 'c' } } },
	});

	rep.on('change', (newVal, oldVal, operations) => {
		if (!newVal) {
			t.fail('no value');
			return;
		}

		if (newVal.a.b.c !== 'nestedChangeOK') {
			return;
		}

		t.deepEqual(oldVal, { a: { b: { c: 'c' } } });
		t.deepEqual(newVal, { a: { b: { c: 'nestedChangeOK' } } });
		t.deepEqual(operations, [
			{
				args: {
					newValue: { a: { b: { c: 'c' } } },
				},
				method: 'overwrite',
				path: '/',
			},
			{
				args: {
					newValue: 'nestedChangeOK',
					prop: 'c',
				},
				method: 'update',
				path: '/a/b',
			},
		]);
		t.end();
	});

	rep.value!.a.b.c = 'nestedChangeOK';
});

test.serial('memoization', (t) => {
	t.is(t.context.apis.extension.Replicant('memoizationTest'), t.context.apis.extension.Replicant('memoizationTest'));
});

test.serial.cb('should only apply array splices from the client once', (t) => {
	t.plan(1);

	const serverRep = t.context.apis.extension.Replicant('clientDoubleApplyTest', {
		persistent: false,
		defaultValue: [],
	});

	void dashboard
		.evaluate(
			async () =>
				new Promise((resolve) => {
					(window as any).clientDoubleApplyTest = window.dashboardApi.Replicant('clientDoubleApplyTest');
					(window as any).clientDoubleApplyTest.on('declared', () => {
						(window as any).clientDoubleApplyTest.on('change', resolve);
					});
				}),
		)
		.then(() => {
			serverRep.on('change', (newVal) => {
				if (Array.isArray(newVal) && newVal[0] === 'test') {
					t.deepEqual(newVal, ['test']);
					t.end();
				}
			});
			void dashboard.evaluate(() => (window as any).clientDoubleApplyTest.value.push('test'));
		});
});

test.serial('should remove .once listeners when quickfired', (t) => {
	const rep = t.context.apis.extension.Replicant('serverRemoveOnceListener', {
		persistent: false,
	});

	let called = false;
	const callback = (): void => {
		called = true;
	};

	rep.once('change', callback);
	t.true(called);
	t.false(rep.listeners('change').includes(callback));
});

test.serial('should not override/quickfire .once for events other than "change"', (t) => {
	const rep = t.context.apis.extension.Replicant('serverNotOverrideOtherOnceListeners', {
		persistent: false,
	});

	rep.once('declared', () => {
		t.fail();
	});
	t.pass();
});

test.serial.cb('arrays - should support the "delete" operator', (t) => {
	t.plan(3);

	const rep = t.context.apis.extension.Replicant<any[]>('serverArrayDelete', {
		persistent: false,
		defaultValue: ['foo', 'bar'],
	});

	rep.on('change', (newVal, oldVal, operations) => {
		if (operations && operations[1].method === 'delete') {
			t.deepEqual(newVal, [, 'bar']); // eslint-disable-line no-sparse-arrays
			t.deepEqual(oldVal, ['foo', 'bar']);
			t.deepEqual(operations, [
				{
					path: '/',
					method: 'overwrite' as const,
					args: {
						newValue: ['foo', 'bar'],
					},
				},
				{
					args: { prop: '0' as any },
					path: '/',
					method: 'delete' as const,
				},
			]);
			t.end();
		}
	});

	delete rep.value![0];
});

test.serial.cb('arrays - should react to changes', (t) => {
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
		t.deepEqual(operations, [
			{
				args: {
					newValue: ['starting'],
				},
				path: '/',
				method: 'overwrite',
			},
			{
				args: {
					mutatorArgs: ['arrPushOK'],
				},
				method: 'push',
				path: '/',
			},
		]);
		t.end();
	});

	rep.value!.push('arrPushOK');
});

test.serial('objects - throw an error when an object is owned by multiple Replicants', (t) => {
	type ValType = Record<string, Record<string, string>>;
	const rep1 = t.context.apis.extension.Replicant<ValType>('multiOwner1');
	const rep2 = t.context.apis.extension.Replicant<ValType>('multiOwner2');
	const bar = { bar: 'bar' };
	rep1.value = {};
	rep2.value = {};
	rep1.value.foo = bar;

	const error = t.throws(() => {
		rep2.value!.foo = bar;
	});

	t.true(error.message.startsWith('This object belongs to another Replicant'));
});

test.serial('dates - should not throw an error', (t) => {
	t.notThrows(() => {
		t.context.apis.extension.Replicant('extensionDateTest', {
			defaultValue: new Date(),
		});
	});
});

test.serial('persistent - should load persisted values when they exist', (t) => {
	const rep = t.context.apis.extension.Replicant('extensionPersistence', { persistenceInterval: 0 });
	t.is(rep.value, 'it work good!');
});

/**
 * This test is really gross.
 * It uses setTimeout, it hits the database, it is just nasty.
 * I can't think of a good way to make this test less awful,
 * so it is being skipped for now.
 */
test.serial.cb.skip('persistent - should persist assignment to database', (t) => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant('extensionPersistence', { persistenceInterval: 0 });
	rep.value = { nested: 'hey we assigned!' };

	/**
	 * This is from 1.0, when we used files on disk
	 * instead of a database.
	 *
	 * To whomeever rewrites this test: you will need to replace this
	 * with something else.
	 */
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

/**
 * This test is really gross.
 * It uses setTimeout, it hits the database, it is just nasty.
 * I can't think of a good way to make this test less awful,
 * so it is being skipped for now.
 */
test.serial.cb.skip('persistent - should persist changes to database', (t) => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant<Record<string, string>>('extensionPersistence', {
		persistenceInterval: 0,
	});
	rep.value!.nested = 'hey we changed!';

	/**
	 * This is from 1.0, when we used files on disk
	 * instead of a database.
	 *
	 * To whomeever rewrites this test: you will need to replace this
	 * with something else.
	 */
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

/**
 * This test is really gross.
 * It uses setTimeout, it hits the database, it is just nasty.
 * I can't think of a good way to make this test less awful,
 * so it is being skipped for now.
 */
test.serial.cb.skip('persistent - should persist top-level string', (t) => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant('extensionPersistence', { persistenceInterval: 0 });
	rep.value = 'lorem';

	/**
	 * This is from 1.0, when we used files on disk
	 * instead of a database.
	 *
	 * To whomeever rewrites this test: you will need to replace this
	 * with something else.
	 */
	setTimeout(() => {
		const replicantPath = path.join(C.replicantsRoot(), 'test-bundle/extensionPersistence.rep');

		fs.readFile(replicantPath, 'utf-8', (err, data) => {
			if (err) {
				throw err;
			}

			t.is(data, '"lorem"');
			t.end();
		});
	}, 10);
});

/**
 * This test is really gross.
 * It uses setTimeout, it hits the database, it is just nasty.
 * I can't think of a good way to make this test less awful,
 * so it is being skipped for now.
 */
test.serial.cb.skip('persistent - should persist top-level undefined', (t) => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant('extensionPersistence', { persistenceInterval: 0 });
	rep.value = undefined;

	/**
	 * This is from 1.0, when we used files on disk
	 * instead of a database.
	 *
	 * To whomeever rewrites this test: you will need to replace this
	 * with something else.
	 */
	setTimeout(() => {
		const replicantPath = path.join(C.replicantsRoot(), 'test-bundle/extensionPersistence.rep');

		fs.readFile(replicantPath, 'utf-8', (err, data) => {
			if (err) {
				throw err;
			}

			t.is(data, '');
			t.end();
		});
	}, 10);
});

/**
 * This test is really gross.
 * It uses setTimeout, it hits the database, it is just nasty.
 * I can't think of a good way to make this test less awful,
 * so it is being skipped for now.
 */
test.serial.cb.skip('persistent - should persist falsey values to disk', (t) => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant('extensionFalseyWrite', { persistenceInterval: 0 });
	rep.value = 0;

	/**
	 * This is from 1.0, when we used files on disk
	 * instead of a database.
	 *
	 * To whomeever rewrites this test: you will need to replace this
	 * with something else.
	 */
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

test.serial('persistent - should read falsey values from disk', (t) => {
	const rep = t.context.apis.extension.Replicant('extensionFalseyRead', { persistenceInterval: 0 });
	t.is(rep.value, 0);
});

/**
 * This test is really gross.
 * It uses setTimeout, it hits the database, it is just nasty.
 * I can't think of a good way to make this test less awful,
 * so it is being skipped for now.
 */
test.serial.cb.skip('transient - should not write their value to disk', (t) => {
	t.plan(2);

	/**
	 * This is from 1.0, when we used files on disk
	 * instead of a database.
	 *
	 * To whomeever rewrites this test: you will need to replace this
	 * with something else.
	 */
	// Remove the file if it exists for some reason
	const replicantPath = path.join(C.replicantsRoot(), 'test-bundle/extensionTransience.rep');
	fs.unlink(replicantPath, (err) => {
		if (err && err.code !== 'ENOENT') {
			throw err;
		}

		const rep = t.context.apis.extension.Replicant('extensionTransience', { persistent: false });
		rep.value = 'o no';
		fs.readFile(replicantPath, (err) => {
			t.truthy(err);
			t.is(err!.code, 'ENOENT');
			t.end();
		});
	});
});

test.serial('should return true when deleting a non-existing property', (t) => {
	const rep = t.context.apis.extension.Replicant('serverDeleteNonExistent', { defaultValue: {} });
	// @ts-expect-error
	t.true(delete rep.value.nonExistent);
});

test.serial("test that one else path that's hard to hit", (t) => {
	const rep = t.context.apis.extension.Replicant<boolean[]>('arrayWithoutSchemaSetHandler', { defaultValue: [] });
	rep.value![0] = true;
	t.pass();
});

test.serial('should leave the default value intact', (t) => {
	const defaultValue = { lorem: 'ipsum' };
	const rep = t.context.apis.extension.Replicant('defaultValueIntact', { defaultValue });

	t.is(rep.opts.defaultValue, defaultValue);
	t.not(rep.value, defaultValue);
});
