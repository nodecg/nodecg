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
import type { NodeCG } from '../../src/types/nodecg';

let dashboard: puppeteer.Page;
test.before(async () => {
	dashboard = await initDashboard();
});

test.serial('should return a reference to any already-declared replicant', async (t) => {
	const ret = await dashboard.evaluate(() => {
		const rep1 = window.dashboardApi.Replicant('clientDupRef');
		const rep2 = window.dashboardApi.Replicant('clientDupRef');
		return rep1 === rep2;
	});

	t.true(ret);
});

test.serial('should only apply defaultValue when first declared', async (t) => {
	t.context.apis.extension.Replicant('clientTest', {
		defaultValue: 'foo',
		persistent: false,
	});

	const ret = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep = window.dashboardApi.Replicant('clientTest', { defaultValue: 'bar' });
				rep.on('declared', () => {
					resolve(rep.value);
				});
			}),
	);

	t.is(ret, 'foo');
});

test.serial('should be readable without subscription, via readReplicant', async (t) => {
	t.context.apis.extension.Replicant('clientReadReplicentTest', {
		defaultValue: 'foo',
		persistent: false,
	});

	const ret = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				window.dashboardApi.readReplicant('clientReadReplicentTest', resolve);
			}),
	);

	t.is(ret, 'foo');
});

test.serial('should throw an error when no name is provided', async (t) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				try {
					// @ts-expect-error
					window.dashboardApi.Replicant();
				} catch (e) {
					resolve(e.message);
				}
			}),
	);

	t.is(ret, 'Must supply a name when instantiating a Replicant');
});

test.serial('should be assignable via the ".value" property', async (t) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise<{ value: unknown; revision: number }>((resolve) => {
				const rep = window.dashboardApi.Replicant('clientAssignmentTest', { persistent: false });
				rep.on('change', (newVal) => {
					if (newVal === 'assignmentOK') {
						resolve({
							value: rep.value,
							revision: rep.revision,
						});
					}
				});
				rep.value = 'assignmentOK';
			}),
	);

	t.is(ret.value, 'assignmentOK');
	t.is(ret.revision, 1);
});

test.serial('should emit a "change" event after successful declaration when the value is undefined', async (t) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise<{ valueWasUndefined: boolean; revision: number }>((resolve) => {
				const rep = window.dashboardApi.Replicant('clientUndefinedChangeTest', { persistent: false });
				rep.on('change', () => {
					resolve({
						// Little hack to workaround the fact that `undefined` gets serialized to `null`.
						valueWasUndefined: rep.value === undefined,
						revision: rep.revision,
					});
				});
			}),
	);

	t.is(ret.valueWasUndefined, true);
	t.is(ret.revision, 0);
});

test.serial(
	'should log a warning when attempting to access .value before the Replicant has finished declaring',
	async (t) => {
		const ret = await dashboard.evaluate(
			async () =>
				new Promise<unknown[]>((resolve) => {
					const rep = window.dashboardApi.Replicant('clientEarlyValueAccess', { persistent: false });

					// TODO: Replace this with sinon.
					const originalWarn = rep.log.warn;
					rep.log.warn = (...args) => {
						rep.log.warn = originalWarn;
						resolve(args);
					};

					const val = rep.value;
					if (typeof val === 'string') {
						val.trim();
					}
				}),
		);

		t.is(
			ret[0],
			'Attempted to get value before Replicant had finished declaring. This will always return undefined.',
		);
	},
);

test.serial('should remove .once listeners when quickfired', async (t) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise<number>((resolve) => {
				const rep = window.dashboardApi.Replicant('clientRemoveOnceListener', {
					persistent: false,
				});

				rep.once('declared', () => {
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					rep.once('change', () => {});
					resolve(rep.listenerCount('change'));
				});
			}),
	);

	t.is(ret, 0);
});

test.serial('when an array - should react to changes', async (t) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise<{
				newVal: unknown[];
				oldVal: unknown[];
				operations: Array<NodeCG.Replicant.Operation<unknown[]>>;
			}>((resolve) => {
				const rep = window.dashboardApi.Replicant('clientArrTest', {
					persistent: false,
					defaultValue: ['starting'],
				});

				rep.on('declared', () => {
					rep.on('change', (newVal, oldVal, operations) => {
						if (newVal && oldVal && operations && operations[0].method === 'push') {
							const res = {
								newVal: JSON.parse(JSON.stringify(newVal)),
								oldVal,
								operations,
							};
							resolve(res);
						}
					});

					rep.value!.push('arrPushOK');
				});
			}),
	);

	t.deepEqual(ret.newVal, ['starting', 'arrPushOK']);
	t.deepEqual(ret.oldVal, ['starting']);
	t.deepEqual(ret.operations, [
		{
			args: {
				mutatorArgs: ['arrPushOK'],
			},
			path: '/',
			method: 'push' as const,
		},
	]);
});

test.serial('when an array - should support the "delete" operator', async (t) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise<{
				newVal: unknown[];
				oldVal: unknown[];
				operations: Array<NodeCG.Replicant.Operation<unknown[]>>;
			}>((resolve, reject) => {
				const rep = window.dashboardApi.Replicant<unknown[]>('clientArrayDelete', {
					defaultValue: ['foo', 'bar'],
					persistent: false,
				});

				let deleted = false;
				rep.on('change', (newVal, oldVal, operations) => {
					if (!newVal) {
						reject(new Error('no value'));
						return;
					}

					if (newVal[0] === 'foo' && !deleted) {
						delete rep.value![0];
						deleted = true;
					} else if (newVal[0] === undefined) {
						const res = {
							newVal,
							oldVal,
							operations,
						};
						resolve(JSON.parse(JSON.stringify(res)));
					}
				});
			}),
	);

	// This ends up being "null" rather than a sparse array, because JSON doesn't handle sparse arrays.
	// If we really need it to, we can convert the array to an object before stringification, then convert back to an array.
	t.deepEqual(ret.newVal, [null, 'bar']);
	t.deepEqual(ret.oldVal, ['foo', 'bar']);
	t.deepEqual(ret.operations, [
		{
			args: { prop: '0' as any },
			path: '/',
			method: 'delete' as const,
		},
	]);
});

test.serial.cb('when an array - should proxy objects added to arrays via array insertion methods', (t) => {
	const rep = t.context.apis.extension.Replicant<Array<Record<string, string>>>('serverArrInsertObj', {
		defaultValue: [],
	});
	rep.value!.push({ foo: 'foo' });
	rep.on('change', (newVal) => {
		if (!newVal) {
			t.fail('no value');
			return;
		}

		if (newVal[0].foo === 'bar') {
			t.deepEqual(newVal, [{ foo: 'bar' }]);
			t.end();
		}
	});

	process.nextTick(() => {
		rep.value![0].foo = 'bar';
	});
});

test.serial.cb('when an object - should not cause server-side replicants to lose observation', (t) => {
	t.plan(2);
	setTimeout(() => {
		t.end('Timeout');
	}, 1000);

	const rep = t.context.apis.extension.Replicant<Record<string, string>>('clientServerObservation', {
		defaultValue: { foo: 'foo' },
		persistent: false,
	});

	dashboard
		.evaluate(
			async () =>
				new Promise((resolve, reject) => {
					let barred = false;
					const rep = window.dashboardApi.Replicant<Record<string, string>>('clientServerObservation');
					rep.on('change', (newVal) => {
						if (!newVal) {
							reject(new Error('no value'));
							return;
						}

						if (newVal.foo === 'bar') {
							resolve(JSON.parse(JSON.stringify(newVal)));
						} else if (!barred) {
							barred = true;
							rep.value!.foo = 'bar';
						}
					});
				}),
		)
		.then((ret) => {
			t.deepEqual(ret, { foo: 'bar' });

			rep.on('change', (newVal) => {
				if (!newVal) {
					t.fail('no value');
					return;
				}

				if (newVal.foo === 'baz') {
					t.pass();
					t.end();
				}
			});

			rep.value!.foo = 'baz';
		})
		.catch(t.fail);
});

test.serial('when an object - should react to changes in nested properties', async (t) => {
	type RepType = Record<string, any>;
	const ret = await dashboard.evaluate(
		async () =>
			new Promise<{
				newVal: RepType;
				oldVal: RepType;
				operations: Array<NodeCG.Replicant.Operation<RepType>>;
			}>((resolve) => {
				const rep = window.dashboardApi.Replicant<RepType>('clientObjTest', {
					persistent: false,
					defaultValue: {
						a: {
							b: {
								c: 'c',
							},
						},
					},
				});

				rep.on('declared', () => {
					rep.on('change', (newVal, oldVal, operations) => {
						if (newVal && oldVal && operations && operations[0].method === 'update') {
							resolve({
								newVal: JSON.parse(JSON.stringify(newVal)),
								oldVal,
								operations,
							});
						}
					});

					rep.value!.a.b.c = 'nestedChangeOK';
				});
			}),
	);

	t.deepEqual(ret.oldVal, {
		a: { b: { c: 'c' } },
	});
	t.deepEqual(ret.newVal, {
		a: {
			b: {
				c: 'nestedChangeOK',
			},
		},
	});
	t.deepEqual(ret.operations, [
		{
			args: {
				newValue: 'nestedChangeOK',
				prop: 'c',
			},
			path: '/a/b',
			method: 'update' as const,
		},
	]);
});

// This specifically tests the following case:
// When the server has a replicant with an array nested inside an object, and that array changes,
// the server should detect that change event, emit it to all clients,
// and the clients should then digest that change and emit a "change" event.
// This test is to address a very specific bug reported by Love Olsson.
test.serial('when an object - should react to server-side changes of array properties', async (t) => {
	type RepType = { arr: any[] };
	const serverRep = t.context.apis.extension.Replicant<RepType>('s2c_nestedArrTest', {
		persistent: false,
		defaultValue: {
			arr: [],
		},
	});

	await dashboard.evaluate(
		async () =>
			new Promise<void>((resolve) => {
				const rep = window.dashboardApi.Replicant<RepType>('s2c_nestedArrTest');
				rep.on('declared', () => {
					resolve();
					rep.on('change', (newVal, oldVal, operations) => {
						if (newVal && oldVal && operations) {
							(window as any).s2c_nestedArrChange = JSON.parse(
								JSON.stringify({
									newVal,
									oldVal,
									operations,
								}),
							);
						}
					});
				});
			}),
	);

	serverRep.value!.arr.push('test');

	const ret = await dashboard.waitForFunction(() => (window as any).s2c_nestedArrChange, { timeout: 1000 });
	const retJson: {
		newVal: RepType;
		oldVal: RepType;
		operations: Array<NodeCG.Replicant.Operation<RepType>>;
	} = (await ret.jsonValue()) as any;

	t.deepEqual(retJson.newVal, { arr: ['test'] });
	t.deepEqual(retJson.oldVal, { arr: [] });
	t.deepEqual(retJson.operations, [
		{
			args: {
				mutatorArgs: ['test'],
			},
			path: '/arr',
			method: 'push' as const,
		},
	]);
});

test.serial('when an object - should support the "delete" operator', async (t) => {
	type RepType = {
		foo?: string;
		bar: string;
	};

	const ret = await dashboard.evaluate(
		async () =>
			new Promise<{
				newVal: RepType;
				oldVal: RepType;
				operations: Array<NodeCG.Replicant.Operation<RepType>>;
			}>((resolve, reject) => {
				const rep = window.dashboardApi.Replicant<RepType>('clientObjectDelete', {
					defaultValue: {
						foo: 'foo',
						bar: 'bar',
					},
					persistent: false,
				});

				let deleted = false;
				rep.on('change', (newVal, oldVal, operations) => {
					if (!newVal) {
						reject(new Error('no value'));
						return;
					}

					if (newVal.foo && !deleted) {
						delete rep.value!.foo;
						deleted = true;
					} else if (newVal.bar && !newVal.foo) {
						resolve(
							JSON.parse(
								JSON.stringify({
									newVal,
									oldVal,
									operations,
								}),
							),
						);
					}
				});
			}),
	);

	t.deepEqual(ret.newVal, { bar: 'bar' });
	t.deepEqual(ret.oldVal, {
		foo: 'foo',
		bar: 'bar',
	});
	t.deepEqual(ret.operations, [
		{
			args: { prop: 'foo' as const },
			path: '/',
			method: 'delete' as const,
		},
	]);
});

test.serial.cb('when an object - should properly proxy new objects assigned to properties', (t) => {
	t.plan(1);

	const rep = t.context.apis.extension.Replicant<Record<string, any>>('serverObjProp', {
		defaultValue: { foo: { bar: 'bar' } },
	});

	rep.value!.foo = { baz: 'baz' };

	rep.on('change', (newVal) => {
		if (!newVal) {
			t.fail('no value');
			return;
		}

		if (newVal.foo.baz === 'bax') {
			t.is(newVal.foo.baz, 'bax');
			t.end();
		}
	});

	process.nextTick(() => {
		rep.value!.foo.baz = 'bax';
	});
});

test.serial('when a date - should emit the JSON value to clients', async (t) => {
	const date = new Date();

	t.context.apis.extension.Replicant('clientDateTest', {
		defaultValue: date,
		persistent: false,
	});

	const ret = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				window.dashboardApi.readReplicant('clientDateTest', resolve);
			}),
	);

	t.is(ret, date.toJSON());
});

test.serial('persistent - should load persisted values when they exist', async (t) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep = window.dashboardApi.Replicant('clientPersistence');
				rep.on('change', () => {
					resolve(rep.value);
				});
			}),
	);

	t.is(ret, 'it work good!');
});

/**
 * This test is really gross.
 * It relies on a race, it hits the database, it is just nasty.
 * I can't think of a good way to make this test less awful,
 * so it is being skipped for now.
 */
test.serial.cb.skip('persistent - should persist assignment to disk', (t) => {
	t.plan(1);

	dashboard
		.evaluate(
			async () =>
				new Promise<void>((resolve) => {
					const rep = window.dashboardApi.Replicant<any>('clientPersistence');
					rep.value = { nested: 'hey we assigned!' };
					rep.on('change', (newVal) => {
						if (!newVal) {
							t.fail('no value');
							return;
						}

						if (newVal.nested && newVal.nested === 'hey we assigned!') {
							resolve();
						}
					});
				}),
		)
		.then(() => {
			/**
			 * This is from 1.0, when we used files on disk
			 * instead of a database.
			 *
			 * To whomeever rewrites this test: you will need to replace this
			 * with something else.
			 */
			const replicantPath = path.join(C.replicantsRoot(), 'test-bundle/clientPersistence.rep');
			fs.readFile(replicantPath, 'utf-8', (err, data) => {
				if (err) {
					throw err;
				}

				t.is(data, '{"nested":"hey we assigned!"}');
				t.end();
			});
		})
		.catch(t.fail);
});

/**
 * This test is really gross.
 * It relies on setTimeout, it hits the database, it is just nasty.
 * I can't think of a good way to make this test less awful,
 * so it is being skipped for now.
 */
test.cb.skip('persistent - should persist changes to disk', (t) => {
	t.plan(1);

	const serverRep = t.context.apis.extension.Replicant('clientChangePersistence', { defaultValue: { nested: '' } });
	(async () => {
		await dashboard.evaluate(
			async () =>
				new Promise((resolve) => {
					(window as any).clientChangePersistence = window.dashboardApi.Replicant('clientChangePersistence');
					(window as any).clientChangePersistence.once('change', resolve);
				}),
		);
		serverRep.on('change', (newVal) => {
			if (!newVal) {
				t.fail('no value');
				return;
			}

			if (newVal.nested !== 'hey we changed!') {
				return;
			}

			/**
			 * This is from 1.0, when we used files on disk
			 * instead of a database.
			 *
			 * To whomeever rewrites this test: you will need to replace this
			 * with something else.
			 */
			// On a short timeout to give the Replicator time to write the new value to disk
			setTimeout(() => {
				const replicantPath = path.join(C.replicantsRoot(), 'test-bundle/clientChangePersistence.rep');
				const data = fs.readFileSync(replicantPath, 'utf-8');
				t.is(data, '{"nested":"hey we changed!"}');
				t.end();
			}, 10);
		});
		dashboard
			.evaluate(() => {
				(window as any).clientChangePersistence.value.nested = 'hey we changed!';
			})
			.catch(t.fail);
	})();
});

/**
 * This test is really gross.
 * It relies on a race, it hits the database, it is just nasty.
 * I can't think of a good way to make this test less awful,
 * so it is being skipped for now.
 */
test.serial.cb.skip('persistent - should persist falsey values to disk', (t) => {
	t.plan(1);

	dashboard
		.evaluate(
			async () =>
				new Promise<void>((resolve) => {
					const rep = window.dashboardApi.Replicant('clientFalseyWrite');
					rep.value = 0;
					rep.on('change', (newVal) => {
						if (newVal === 0) {
							resolve();
						}
					});
				}),
		)
		.then(() => {
			/**
			 * This is from 1.0, when we used files on disk
			 * instead of a database.
			 *
			 * To whomeever rewrites this test: you will need to replace this
			 * with something else.
			 */
			const replicantPath = path.join(C.replicantsRoot(), 'test-bundle/clientFalseyWrite.rep');
			fs.readFile(replicantPath, 'utf-8', (err, data) => {
				if (err) {
					throw err;
				}

				t.is(data, '0');
				t.end();
			});
		})
		.catch(t.fail);
});

test.serial('persistent - should read falsey values from disk', async (t) => {
	const ret = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep = window.dashboardApi.Replicant('clientFalseyRead');
				rep.on('declared', () => {
					resolve(rep.value);
				});
			}),
	);

	t.is(ret, 0);
});

/**
 * This test is really gross.
 * It relies on a race, it hits the database, it is just nasty.
 * I can't think of a good way to make this test less awful,
 * so it is being skipped for now.
 */
test.serial.cb.skip('transient - should not write their value to disk', (t) => {
	t.plan(2);

	const replicantPath = path.join(C.replicantsRoot(), 'test-bundle/clientTransience.rep');
	fs.unlink(replicantPath, (err) => {
		if (err && err.code !== 'ENOENT') {
			throw err;
		}

		dashboard
			.evaluate(
				async () =>
					new Promise<void>((resolve) => {
						const rep = window.dashboardApi.Replicant('clientTransience', {
							defaultValue: 'o no',
							persistent: false,
						});

						rep.on('declared', () => {
							resolve();
						});
					}),
			)
			.then(() => {
				/**
				 * This is from 1.0, when we used files on disk
				 * instead of a database.
				 *
				 * To whomeever rewrites this test: you will need to replace this
				 * with something else.
				 */
				fs.readFile(replicantPath, (err) => {
					t.truthy(err);
					t.is(err?.code, 'ENOENT');
					t.end();
				});
			})
			.catch(t.fail);
	});
});

test.serial('#waitForReplicants', async (t) => {
	await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				const rep1 = window.dashboardApi.Replicant('wfp1');
				const rep2 = window.dashboardApi.Replicant('wfp2');
				const rep3 = window.dashboardApi.Replicant('wfp3');
				(window as any).NodeCG.waitForReplicants(rep1, rep2, rep3).then(resolve);
			}),
	);

	t.pass();
});

test.serial('emits assignment in the correct order', async (t) => {
	const extRep = t.context.apis.extension.Replicant<any[]>('assignment_order', { defaultValue: [] });

	await dashboard.evaluate(
		async () =>
			new Promise<void>((resolve) => {
				(window as any).clientRep = window.dashboardApi.Replicant('assignment_order');
				(window as any).clientRep.once('declared', () => {
					resolve();
				});
			}),
	);

	extRep.value!.push('foo');
	extRep.value = ['bar'];

	const ret = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				(window as any).clientRep.on('change', (newVal: any) => {
					if ((window as any).clientRep.revision === 2) {
						resolve({
							// Without this JSON.parse hack,
							// newVal gets serialized as an empty object.
							// Possibly a bug in the DevTools protocol used by Puppeteer?
							newVal: JSON.parse(JSON.stringify(newVal)),
							revision: (window as any).clientRep.revision,
						});
					}
				});
			}),
	);

	// If the ordering is wrong, `ret` will be `['bar', 'foo']`.
	t.deepEqual(ret, {
		newVal: ['bar'],
		revision: 2,
	});
});
