'use strict';

// Packages
const test = require('ava');

// Ours
require('../helpers/nodecg-and-webdriver')(test, ['dashboard']); // Must be first.
const e = require('../helpers/test-environment');
test.beforeEach(() => {
	return e.browser.client.switchTab(e.browser.tabs.dashboard);
});

test.serial('should create a default value based on the schema, if none is provided', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaDefaults');
		rep.on('declared', () => done(rep.value));
	});

	t.deepEqual(res.value, {
		string: '',
		object: {
			numA: 0
		}
	});
});

test.serial('should accept the defaultValue when it passes validation', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaDefaultValuePass', {
			defaultValue: {
				string: 'foo',
				object: {
					numA: 1
				}
			}
		});
		rep.on('declared', () => done(rep.value));
	});

	t.deepEqual(res.value, {
		string: 'foo',
		object: {
			numA: 1
		}
	});
});

test.serial('should throw when defaultValue fails validation', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaDefaultValueFail', {
			defaultValue: {
				string: 0
			}
		});

		rep.once('declarationRejected', reason => {
			done(reason);
		});
	});

	t.true(res.value.startsWith('Invalid value rejected for replicant "client_schemaDefaultValueFail"'));
});

test.serial('should accept the persisted value when it passes validation', async t => {
	// Persisted value is copied from fixtures
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaPersistencePass');
		rep.on('declared', () => {
			done(rep.value);
		});
	});

	t.deepEqual(res.value, {
		string: 'foo',
		object: {
			numA: 1
		}
	});
});

test.serial('should reject the persisted value when it fails validation, replacing with schemaDefaults', async t => {
	// Persisted value is copied from fixtures
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaPersistenceFail');
		rep.on('declared', () => done(rep.value));
	});

	t.deepEqual(res.value, {
		string: '',
		object: {
			numA: 0
		}
	});
});

test.serial('should accept valid assignment', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaAssignPass');
		rep.once('declared', () => {
			rep.value = {
				string: 'foo',
				object: {
					numA: 1
				}
			};

			rep.on('change', newVal => {
				if (newVal.string === 'foo') {
					done(rep.value);
				}
			});
		});
	});

	t.deepEqual(res.value, {
		string: 'foo',
		object: {
			numA: 1
		}
	});
});

test.serial('should throw on invalid assignment', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaAssignFail');
		rep.once('declared', () => {
			try {
				rep.value = {
					string: 0
				};
			} catch (e) {
				done(e.message);
			}
		});
	});

	t.true(res.value.startsWith('Invalid value rejected for replicant "client_schemaAssignFail"'));
});

test.serial('should accept valid property deletion', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaDeletionPass');
		rep.once('declared', () => {
			delete rep.value.object.numB;
			rep.on('change', newVal => {
				if (!newVal.object.numB) {
					done(rep.value);
				}
			});
		});
	});

	t.deepEqual(res.value, {
		string: '',
		object: {
			numA: 0
		}
	});
});

test.serial('should throw on invalid property deletion', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaDeletionFail');
		rep.once('declared', () => {
			try {
				delete rep.value.object.numA;
			} catch (e) {
				done(e.message);
			}
		});
	});

	t.true(res.value.startsWith('Invalid value rejected for replicant "client_schemaDeletionFail"'));
});

test.serial('should accept valid array mutation via array mutator methods', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaArrayMutatorPass');
		rep.once('declared', () => {
			rep.value.array.push('foo');
			rep.on('change', newVal => {
				if (newVal.array.length === 1) {
					done(rep.value);
				}
			});
		});
	});

	t.deepEqual(res.value, {
		string: '',
		array: [
			'foo'
		]
	});
});

test.serial('should throw on invalid array mutation via array mutator methods', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaArrayMutatorFail');
		rep.once('declared', () => {
			try {
				rep.value.array.push(0);
			} catch (e) {
				done(e.message);
			}
		});
	});

	t.true(res.value.startsWith('Invalid value rejected for replicant "client_schemaArrayMutatorFail"'));
});

test.serial('should accept valid property changes to arrays', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaArrayChangePass');
		rep.once('declared', () => {
			rep.value.array[0] = 'bar';
			rep.on('change', newVal => {
				if (newVal.array[0] === 'bar') {
					done(rep.value);
				}
			});
		});
	});

	t.deepEqual(res.value, {
		string: '',
		array: [
			'bar'
		]
	});
});

test.serial('should throw on invalid property changes to arrays', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaArrayChangeFail');
		rep.once('declared', () => {
			try {
				rep.value.array[0] = 0;
			} catch (e) {
				done(e.message);
			}
		});
	});

	t.true(res.value.startsWith('Invalid value rejected for replicant "client_schemaArrayChangeFail"'));
});

test.serial('should accept valid property changes to objects', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaObjectChangePass');
		rep.once('declared', () => {
			rep.value.object.numA = 1;
			rep.on('change', newVal => {
				if (newVal.object.numA === 1) {
					done(rep.value);
				}
			});
		});
	});

	t.deepEqual(res.value, {
		string: '',
		object: {
			numA: 1
		}
	});
});

test.serial('should throw on invalid property changes to objects', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaObjectChangeFail');
		rep.once('declared', () => {
			try {
				rep.value.object.numA = 'foo';
			} catch (e) {
				done(e.message);
			}
		});
	});

	t.true(res.value.startsWith('Invalid value rejected for replicant "client_schemaObjectChangeFail"'));
});

test.serial('should reject assignment if it was validated against a different version of the schema', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaAssignMismatch');
		rep.once('declared', () => {
			rep.schemaSum = 'baz';
			try {
				rep.value = {
					string: 'foo',
					object: {
						numA: 1
					}
				};
			} catch (e) {
				done(e.message);
			}
		});

		rep.once('assignmentRejected', reason => {
			done(reason);
		});
	});

	t.true(res.value.startsWith('Mismatched schema version, assignment rejected'));
});

test.serial('should reject operations if they were validated against a different version of the schema', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('client_schemaOperationMismatch');
		rep.once('declared', () => {
			rep.schemaSum = 'baz';
			try {
				rep.value.object.numA = 1;
			} catch (e) {
				done(e.message);
			}
		});

		rep.once('operationsRejected', reason => {
			done(reason);
		});
	});

	t.true(res.value.startsWith('Mismatched schema version, assignment rejected'));
});

// This isn't _actually_ testing schemas, it's just a bug that is easiest to detect when using a schema.
// The problem was that certain cases were assigning incorrect paths to the metadataMap.
// This use case (from another project) just so happened to trigger this error.
// I more or less copied that code and schema directly here just to write the test as fast as possible.
// This test should probably be re-written to be more targeted and remove any cruft.
// Lange - 2017/05/04
test.serial('shouldn\'t fuck up', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const rep = window.dashboardApi.Replicant('schedule:state');
		rep.once('declared', () => {
			rep.value.matchMap = [
				false, false, false, false,
				false, false, false, false
			];

			rep.on('change', newVal => {
				if (!newVal.matchMap.includes(true)) {
					try {
						rep.value.matchMap[6] = true;
						done(true);
					} catch (e) {
						done(e.message);
					}
				}
			});
		});
	});

	t.true(res.value);
});
