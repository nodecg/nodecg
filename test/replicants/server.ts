// Packages
import type { TestFn } from 'ava';
import anyTest from 'ava';
import type * as puppeteer from 'puppeteer';

// Ours
import * as server from '../helpers/server';
import * as browser from '../helpers/browser';
import type { AbstractReplicant } from '../../src/shared/replicants.shared';

const test = anyTest as TestFn<browser.BrowserContext & server.ServerContext>;
server.setup();
const { initDashboard } = browser.setup();

import { getConnection, Replicant } from '../../src/server/database/default/connection';
import { sleep, waitOneTick } from '../helpers/utilities';

let dashboard: puppeteer.Page;
let database: Awaited<ReturnType<typeof getConnection>>;
test.before(async () => {
	dashboard = await initDashboard();
	database = await getConnection();
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

	const rep = t.context.apis.extension.Replicant('extensionTest', {
		defaultValue: 'bar',
	});
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

	if (!error) return t.fail();
	return t.true(error.message.includes('Must supply a name when instantiating a Replicant'));
});

test.serial('should not explode when schema is invalid', (t) => {
	t.notThrows(() => {
		t.context.apis.extension.Replicant('badSchema');
	});
});

test.serial('should be assignable via the ".value" property', (t) => {
	const rep = t.context.apis.extension.Replicant('extensionAssignmentTest', {
		persistent: false,
	});
	rep.value = 'assignmentOK';
	t.is(rep.value, 'assignmentOK');
});

test.serial('should react to changes in nested properties of objects', async (t) => {
	t.plan(3);

	const rep = t.context.apis.extension.Replicant('extensionObjTest', {
		persistent: false,
		defaultValue: { a: { b: { c: 'c' } } },
	});

	const promise = new Promise<void>((resolve) => {
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
						newValue: 'nestedChangeOK',
						prop: 'c',
					},
					method: 'update',
					path: '/a/b',
				},
			]);
			resolve();
		});
	});

	rep.value.a.b.c = 'nestedChangeOK';

	return promise;
});

test.serial('memoization', (t) => {
	t.is(t.context.apis.extension.Replicant('memoizationTest'), t.context.apis.extension.Replicant('memoizationTest'));
});

test.serial('should only apply array splices from the client once', async (t) => {
	t.plan(3);

	const serverRep = t.context.apis.extension.Replicant('clientDoubleApplyTest', {
		persistent: false,
		defaultValue: [],
	});

	return dashboard
		.evaluate(
			async () =>
				new Promise<void>((resolve) => {
					(window as any).clientDoubleApplyTest = window.dashboardApi.Replicant('clientDoubleApplyTest');
					(window as any).clientDoubleApplyTest.once('declared', () => {
						(window as any).clientDoubleApplyTest.on('change', () => {
							resolve();
						});
					});
				}),
		)
		.then(async () => {
			let changeNum = 0;
			const promise = new Promise<void>((resolve) => {
				serverRep.on('change', (newVal) => {
					if (changeNum === 0) {
						t.deepEqual(newVal, []);
					} else {
						t.deepEqual(newVal, ['test']);
						resolve();
					}

					changeNum++;
				});
			});

			t.deepEqual(serverRep.value, []);

			await dashboard.evaluate(() => (window as any).clientDoubleApplyTest.value.push('test'));

			return promise;
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

test.serial('arrays - should support the "delete" operator', async (t) => {
	t.plan(3);

	let deleted = false;

	const rep = t.context.apis.extension.Replicant<any[]>('serverArrayDelete', {
		persistent: false,
		defaultValue: ['foo', 'bar'],
	});

	const promise = new Promise<void>((resolve) => {
		rep.on('change', (newVal, oldVal, operations) => {
			if (!deleted) {
				return;
			}

			t.deepEqual(newVal, [, 'bar']); // eslint-disable-line no-sparse-arrays
			t.deepEqual(oldVal, ['foo', 'bar']);
			t.deepEqual(operations, [
				{
					args: { prop: '0' as any },
					path: '/',
					method: 'delete' as const,
				},
			]);
			resolve();
		});
	});

	process.nextTick(() => {
		delete rep.value[0];
		deleted = true;
	});

	return promise;
});

test.serial('arrays - should react to changes', async (t) => {
	t.plan(3);

	let pushed = false;

	const rep = t.context.apis.extension.Replicant('extensionArrTest', {
		persistent: false,
		defaultValue: ['starting'],
	});

	const promise = new Promise<void>((resolve) => {
		rep.on('change', (newVal, oldVal, operations) => {
			if (!pushed) {
				return;
			}

			t.deepEqual(oldVal, ['starting']);
			t.deepEqual(newVal, ['starting', 'arrPushOK']);
			t.deepEqual(operations, [
				{
					args: {
						mutatorArgs: ['arrPushOK'],
					},
					method: 'push',
					path: '/',
				},
			]);
			resolve();
		});
	});

	process.nextTick(() => {
		rep.value.push('arrPushOK');
		pushed = true;
	});

	return promise;
});

test.serial('objects - throw an error when an object is owned by multiple Replicants', (t) => {
	type ValType = Record<string, Record<string, string>>;
	const rep1 = t.context.apis.extension.Replicant<ValType>('multiOwner1');
	const rep2 = t.context.apis.extension.Replicant<ValType>('multiOwner2');
	const bar = { bar: 'bar' };
	rep1.value = {};
	rep2.value = {};
	rep1.value['foo'] = bar;

	const error = t.throws(() => {
		if (rep2.value) {
			rep2.value['foo'] = bar;
		}
	});

	if (!error) return t.fail();
	return t.true(error.message.startsWith('This object belongs to another Replicant'));
});

test.serial('dates - should not throw an error', (t) => {
	t.notThrows(() => {
		t.context.apis.extension.Replicant('extensionDateTest', {
			defaultValue: new Date(),
		});
	});
});

test.serial('persistent - should load persisted values when they exist', async (t) => {
	const rep = t.context.apis.extension.Replicant('extensionPersistence', {
		persistenceInterval: 0,
	});
	t.is(rep.value, 'it work good!');
	await t.context.server.saveAllReplicantsNow();
});

test.serial('persistent - should persist assignment to database', async (t) => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant('extensionPersistence', {
		persistenceInterval: 0,
	});
	rep.value = { nested: 'hey we assigned!' };

	await t.context.server.saveAllReplicantsNow();

	const fromDb = await database.manager.findOneByOrFail(Replicant, {
		namespace: 'test-bundle',
		name: 'extensionPersistence',
	});

	t.is(fromDb.value, '{"nested":"hey we assigned!"}');
});

test.serial('persistent - should persist changes to database', async (t) => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant<Record<string, string>>('extensionPersistence', {
		persistenceInterval: 0,
	}) as unknown as AbstractReplicant<'server', Record<string, string>, Record<string, unknown>, true>;
	rep.value['nested'] = 'hey we changed!';

	await t.context.server.saveAllReplicantsNow();

	const fromDb = await database.manager.findOneByOrFail(Replicant, {
		namespace: 'test-bundle',
		name: 'extensionPersistence',
	});

	t.is(fromDb.value, '{"nested":"hey we changed!"}');
});

test.serial('persistent - should persist top-level string', async (t) => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant('extensionPersistence', {
		persistenceInterval: 0,
	});
	rep.value = 'lorem';

	await t.context.server.saveAllReplicantsNow();

	const fromDb = await database.manager.findOneByOrFail(Replicant, {
		namespace: 'test-bundle',
		name: 'extensionPersistence',
	});

	t.is(fromDb.value, '"lorem"');
});

test.serial('persistent - should persist top-level undefined', async (t) => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant('extensionPersistence', {
		persistenceInterval: 0,
	});
	rep.value = undefined;

	await t.context.server.saveAllReplicantsNow();

	const fromDb = await database.manager.findOneByOrFail(Replicant, {
		namespace: 'test-bundle',
		name: 'extensionPersistence',
	});

	t.is(fromDb.value, '');
});

test.serial('persistent - should persist falsey values to disk', async (t) => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant('extensionFalseyWrite', {
		persistenceInterval: 0,
	});
	rep.value = 0;

	await t.context.server.saveAllReplicantsNow();

	const fromDb = await database.manager.findOneByOrFail(Replicant, {
		namespace: 'test-bundle',
		name: 'extensionFalseyWrite',
	});

	t.is(fromDb.value, '0');
});

test.serial('persistent - should read falsey values from disk', (t) => {
	const rep = t.context.apis.extension.Replicant('extensionFalseyRead', {
		persistenceInterval: 0,
	});
	t.is(rep.value, 0);
});

test.serial('transient - should not write their value to disk', async (t) => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant('extensionTransience', {
		persistent: false,
	});
	rep.value = 'o no';

	await t.context.server.saveAllReplicantsNow();

	const fromDb = await database.manager.findOneBy(Replicant, {
		namespace: 'test-bundle',
		name: 'extensionTransience',
	});

	t.is(fromDb, null);
});

test.serial('should return true when deleting a non-existing property', (t) => {
	const rep = t.context.apis.extension.Replicant('serverDeleteNonExistent', {
		defaultValue: {},
	});
	// @ts-expect-error
	t.true(delete rep.value.nonExistent);
});

test.serial("test that one else path that's hard to hit", (t) => {
	const rep = t.context.apis.extension.Replicant<boolean[]>('arrayWithoutSchemaSetHandler', { defaultValue: [] });
	rep.value[0] = true;
	t.pass();
});

test.serial('should leave the default value intact', (t) => {
	const defaultValue = { lorem: 'ipsum' };
	const rep = t.context.apis.extension.Replicant('defaultValueIntact', {
		defaultValue,
	});

	t.is(rep.opts.defaultValue, defaultValue);
	t.not(rep.value, defaultValue);
});

test.serial('provides accurate new and old values for assignment operations', async (t) => {
	t.plan(8);

	const rep = t.context.apis.extension.Replicant<number | undefined>('serverNewAndOldValues');
	let changeNumber = 0;

	const promise = new Promise<void>((resolve, reject) => {
		rep.on('change', (n, o) => {
			switch (changeNumber++) {
				case 0:
					t.is(n, undefined);
					t.is(o, undefined);
					break;
				case 1:
					t.is(n, 1);
					t.is(o, undefined);
					break;
				case 2:
					t.is(n, 2);
					t.is(o, 1);
					break;
				case 3:
					t.is(n, 3);
					t.is(o, 2);
					resolve();
					return;
				default:
					t.fail(`Unexpected change number "${changeNumber}"`);
					reject();
					return;
			}

			setTimeout(() => {
				if (n === undefined) {
					rep.value = 1;
				} else if (typeof rep.value === 'number') {
					rep.value++;
				} else {
					throw new Error('Not sure how we got here');
				}
			}, 0);
		});
	});

	await promise;
});

test.serial('should not emit more than one change event on startup when a defaultValue is supplied', async (t) => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant('multipleStartupChangeEvents', { defaultValue: 0 });

	let numChanges = 0;
	rep.on('change', () => {
		numChanges++;
		if (numChanges > 1) {
			t.fail('Too many change events emitted');
		}
	});

	await waitOneTick();

	t.is(numChanges, 1);
});

test.serial('should force persistence after maximumTimeAReplicantCanGoWithoutSaving', async (t) => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant('maximumTimeAReplicantCanGoWithoutSaving', {
		defaultValue: 0,
		persistenceInterval: 100,
	});

	// Update faster than the persistenceInterval, to prevent the throttle/debounce from ever resolving
	const interval = setInterval(() => {
		rep.value++;
	}, 50);

	await sleep(250);

	// If the Replicant hasn't been able to persist a single time yet,
	// this call will fail saying it couldn't find it.
	const fromDb = await database.manager.findOneByOrFail(Replicant, {
		namespace: 'test-bundle',
		name: 'maximumTimeAReplicantCanGoWithoutSaving',
	});

	t.true(parseInt(fromDb.value, 10) > 0);
	clearInterval(interval);
});
