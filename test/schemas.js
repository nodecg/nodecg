/* eslint-env node, mocha, browser */
'use strict';

// Native
const path = require('path');

// Packages
const chai = require('chai');

// Ours
const e = require('./setup/test-environment');

const assert = chai.assert;

describe('client-side replicant schemas', function () {
	this.timeout(10000);

	before(() => {
		return e.browser.client.switchTab(e.browser.tabs.dashboard);
	});

	it('should create a default value based on the schema, if none is provided', async () => {
		const res = await e.browser.client.executeAsync(done => {
			const rep = window.dashboardApi.Replicant('client_schemaDefaults');
			rep.on('declared', () => done(rep.value));
		});
		assert.deepEqual(res.value, {
			string: '',
			object: {
				numA: 0
			}
		});
	});

	it('should accept the defaultValue when it passes validation', async () => {
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
		assert.deepEqual(res.value, {
			string: 'foo',
			object: {
				numA: 1
			}
		});
	});

	it('should throw when defaultValue fails validation', async () => {
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
		assert.isTrue(res.value.startsWith('Invalid value rejected for replicant "client_schemaDefaultValueFail"'));
	});

	it('should accept the persisted value when it passes validation', async () => {
		// Persisted value is copied from fixtures
		const res = await e.browser.client.executeAsync(done => {
			const rep = window.dashboardApi.Replicant('client_schemaPersistencePass');
			rep.on('declared', () => {
				done(rep.value);
			});
		});
		assert.deepEqual(res.value, {
			string: 'foo',
			object: {
				numA: 1
			}
		});
	});

	it('should reject the persisted value when it fails validation, replacing with schemaDefaults', async () => {
		// Persisted value is copied from fixtures
		const res = await e.browser.client.executeAsync(done => {
			const rep = window.dashboardApi.Replicant('client_schemaPersistenceFail');
			rep.on('declared', () => done(rep.value));
		});
		assert.deepEqual(res.value, {
			string: '',
			object: {
				numA: 0
			}
		});
	});

	it('should accept valid assignment', async () => {
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
		assert.deepEqual(res.value, {
			string: 'foo',
			object: {
				numA: 1
			}
		});
	});

	it('should throw on invalid assignment', async () => {
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
		assert.isTrue(res.value.startsWith('Invalid value rejected for replicant "client_schemaAssignFail"'));
	});

	it('should accept valid property deletion', async () => {
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
		assert.deepEqual(res.value, {
			string: '',
			object: {
				numA: 0
			}
		});
	});

	it('should throw on invalid property deletion', async () => {
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
		assert.isTrue(res.value.startsWith('Invalid value rejected for replicant "client_schemaDeletionFail"'));
	});

	it('should accept valid array mutation via array mutator methods', async () => {
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
		assert.deepEqual(res.value, {
			string: '',
			array: [
				'foo'
			]
		});
	});

	it('should throw on invalid array mutation via array mutator methods', async () => {
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
		assert.isTrue(res.value.startsWith('Invalid value rejected for replicant "client_schemaArrayMutatorFail"'));
	});

	it('should accept valid property changes to arrays', async () => {
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
		assert.deepEqual(res.value, {
			string: '',
			array: [
				'bar'
			]
		});
	});

	it('should throw on invalid property changes to arrays', async () => {
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
		assert.isTrue(res.value.startsWith('Invalid value rejected for replicant "client_schemaArrayChangeFail"'));
	});

	it('should accept valid property changes to objects', async () => {
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
		assert.deepEqual(res.value, {
			string: '',
			object: {
				numA: 1
			}
		});
	});

	it('should throw on invalid property changes to objects', async () => {
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
		assert.isTrue(res.value.startsWith('Invalid value rejected for replicant "client_schemaObjectChangeFail"'));
	});

	it('should reject assignment if it was validated against a different version of the schema', async () => {
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
		assert.isTrue(res.value.startsWith('Mismatched schema version, assignment rejected'));
	});

	it('should reject operations if they were validated against a different version of the schema', async () => {
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
		assert.isTrue(res.value.startsWith('Mismatched schema version, assignment rejected'));
	});

	// This isn't _actually_ testing schemas, it's just a bug that is easiest to detect when using a schema.
	// The problem was that certain cases were assigning incorrect paths to the metadataMap.
	// This use case (from another project) just so happened to trigger this error.
	// I more or less copied that code and schema directly here just to write the test as fast as possible.
	// This test should probably be re-written to be more targeted and remove any cruft.
	// Lange - 2017/05/04
	it('shouldn\'t fuck up', async () => {
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
		assert.isTrue(res.value);
	});
});

describe('server-side replicant schemas', () => {
	it('should create a default value based on the schema, if none is provided', () => {
		const rep = e.apis.extension.Replicant('schema1');
		assert.deepEqual(rep.value, {
			string: '',
			object: {
				numA: 0
			}
		});
	});

	it('should accept the defaultValue when it passes validation', () => {
		e.apis.extension.Replicant('schema2', {
			defaultValue: {
				string: 'foo',
				object: {
					numA: 1
				}
			}
		});
	});

	it('should throw when defaultValue fails validation', () => {
		assert.throws(() => {
			e.apis.extension.Replicant('schema3', {
				defaultValue: {
					string: 0
				}
			});
		}, /Invalid value rejected for replicant/);
	});

	it('should accept the persisted value when it passes validation', () => {
		// Persisted value is copied from fixtures
		const rep = e.apis.extension.Replicant('schemaPersistencePass');
		assert.deepEqual(rep.value, {
			string: 'foo',
			object: {
				numA: 1
			}
		});
	});

	it('should reject the persisted value when it fails validation, replacing with schemaDefaults', () => {
		// Persisted value is copied from fixtures
		const rep = e.apis.extension.Replicant('schemaPersistenceFail');
		assert.deepEqual(rep.value, {
			string: '',
			object: {
				numA: 0
			}
		});
	});

	it('should accept valid assignment', () => {
		assert.doesNotThrow(() => {
			const rep = e.apis.extension.Replicant('schemaAssignPass');
			rep.value = {
				string: 'foo',
				object: {
					numA: 1
				}
			};
		});
	});

	it('should throw on invalid assignment', () => {
		assert.throws(() => {
			const rep = e.apis.extension.Replicant('schemaAssignFail');
			rep.value = {
				string: 0
			};
		}, /Invalid value rejected for replicant/);
	});

	it('should accept valid property deletion', () => {
		assert.doesNotThrow(() => {
			const rep = e.apis.extension.Replicant('schemaDeletionPass');
			delete rep.value.object.numB;
		});
	});

	it('should throw on invalid property deletion', () => {
		assert.throws(() => {
			const rep = e.apis.extension.Replicant('schemaDeletionFail');
			delete rep.value.object.numA;
		}, /Invalid value rejected for replicant/);
	});

	it('should accept valid array mutation via array mutator methods', () => {
		assert.doesNotThrow(() => {
			const rep = e.apis.extension.Replicant('schemaArrayMutatorPass');
			rep.value.array.push('foo');
		});
	});

	it('should throw on invalid array mutation via array mutator methods', () => {
		assert.throws(() => {
			const rep = e.apis.extension.Replicant('schemaArrayMutatorFail');
			rep.value.array.push(0);
		}, /Invalid value rejected for replicant/);
	});

	it('should accept valid property changes to arrays', () => {
		assert.doesNotThrow(() => {
			const rep = e.apis.extension.Replicant('schemaArrayChangePass');
			rep.value.array[0] = 'bar';
		});
	});

	it('should throw on invalid property changes to arrays', () => {
		assert.throws(() => {
			const rep = e.apis.extension.Replicant('schemaArrayChangeFail');
			rep.value.array[0] = 0;
		}, /Invalid value rejected for replicant/);
	});

	it('should accept valid property changes to objects', () => {
		assert.doesNotThrow(() => {
			const rep = e.apis.extension.Replicant('schemaObjectChangePass');
			rep.value.object.numA = 1;
		});
	});

	it('should throw on invalid property changes to objects', () => {
		assert.throws(() => {
			const rep = e.apis.extension.Replicant('schemaObjectChangeFail');
			rep.value.object.numA = 'foo';
		}, /Invalid value rejected for replicant/);
	});

	it('should properly load schemas provided with an absolute path', () => {
		const rep = e.apis.extension.Replicant('schemaAbsolutePath', {
			schemaPath: path.resolve(__dirname, 'fixtures/absolute-path-schemas/schemaAbsolutePath.json')
		});
		assert.deepEqual(rep.value, {
			string: '',
			object: {
				numA: 0
			}
		});
	});
});
