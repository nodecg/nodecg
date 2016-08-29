/* eslint-env node, mocha, browser */
'use strict';

const chai = require('chai');
const assert = chai.assert;
const e = require('./setup/test-environment');

describe('client-side replicant schemas', function () {
	this.timeout(10000);

	before(done => {
		e.browser.client
			.switchTab(e.browser.tabs.dashboard)
			.execute(() => {
				window.errorOnce = function (callback) {
					window.addEventListener('error', e => {
						e.target.removeEventListener(e.type, callback);
						return callback(e);
					});
				};
			})
			.call(done);
	});

	it('should create a default value based on the schema, if none is provided', done => {
		e.browser.client
			.executeAsync(done => {
				const rep = window.dashboardApi.Replicant('client_schemaDefaults');
				rep.on('declared', () => done(rep.value));
			})
			.then(ret => {
				assert.deepEqual(ret.value, {
					string: '',
					object: {
						numA: 0
					}
				});
				done();
			})
			.catch(err => done(err));
	});

	it('should accept the defaultValue when it passes validation', done => {
		e.browser.client
			.executeAsync(done => {
				const rep = window.dashboardApi.Replicant('client_schemaDefaultValuePass', {
					defaultValue: {
						string: 'foo',
						object: {
							numA: 1
						}
					}
				});
				rep.on('declared', () => done(rep.value));
			})
			.then(ret => {
				assert.deepEqual(ret.value, {
					string: 'foo',
					object: {
						numA: 1
					}
				});
				done();
			})
			.catch(err => done(err));
	});

	it.only('should throw when defaultValue fails validation', done => {
		e.browser.client
			.executeAsync(done => {
				window.dashboardApi.Replicant('client_schemaDefaultValueFail', {
					defaultValue: {
						string: 0
					}
				});

				window.errorOnce(event => {
					done(event.error.message);
				});
			})
			.then(ret => {
				assert.isTrue(ret.value.startsWith('Invalid value for replicant "client_schemaDefaultValueFail"'));
				done();
			})
			.catch(err => done(err));
	});

	it.only('should accept the persisted value when it passes validation', done => {
		// Persisted value is copied from fixtures
		e.browser.client
			.executeAsync(done => {
				console.log('declaring');
				const rep = window.dashboardApi.Replicant('client_schemaPersistencePass');
				rep.on('declared', () => {
					console.log('declared, done');
					done(rep.value);
				});
			})
			.then(ret => {
				assert.deepEqual(ret.value, {
					string: 'foo',
					object: {
						numA: 1
					}
				});
			})
			.log('browser')
			.then(logs => {
				console.log('got them logs');
				console.log(logs.value);
			})
			.call(done)
			.catch(err => done(err));
	});

	it('should reject the persisted value when it fails validation, replacing with schemaDefaults', done => {
		// Persisted value is copied from fixtures
		e.browser.client
			.executeAsync(done => {
				const rep = window.dashboardApi.Replicant('client_schemaPersistenceFail');
				rep.on('declared', () => done(rep.value));
			})
			.then(ret => {
				assert.deepEqual(ret.value, {
					string: '',
					object: {
						numA: 0
					}
				});
				done();
			})
			.catch(err => done(err));
	});

	it('should accept valid assignment', done => {
		e.browser.client
			.executeAsync(done => {
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
			})
			.then(ret => {
				assert.deepEqual(ret.value, {
					string: 'foo',
					object: {
						numA: 1
					}
				});
				done();
			})
			.catch(err => done(err));
	});

	it('should throw on invalid assignment', done => {
		e.browser.client
			.executeAsync(done => {
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
			})
			.then(ret => {
				assert.isTrue(ret.value.startsWith('Invalid value for replicant "client_schemaAssignFail"'));
				done();
			})
			.catch(err => done(err));
	});

	it('should accept valid property deletion', done => {
		e.browser.client
			.executeAsync(done => {
				const rep = window.dashboardApi.Replicant('client_schemaDeletionPass');
				rep.once('declared', () => {
					delete rep.value.object.numB;
					rep.on('change', newVal => {
						if (!newVal.object.numB) {
							done(rep.value);
						}
					});
				});
			})
			.then(ret => {
				assert.deepEqual(ret.value, {
					string: '',
					object: {
						numA: 0
					}
				});
				done();
			})
			.catch(err => done(err));
	});

	it('should throw on invalid property deletion', done => {
		e.browser.client
			.executeAsync(done => {
				const rep = window.dashboardApi.Replicant('client_schemaDeletionFail');
				rep.once('declared', () => {
					try {
						delete rep.value.object.numA;
					} catch (e) {
						done(e.message);
					}
				});
			})
			.then(ret => {
				assert.isTrue(ret.value.startsWith('Invalid value for replicant "client_schemaDeletionFail"'));
				done();
			})
			.catch(err => done(err));
	});

	it('should accept valid array mutation via array mutator methods', done => {
		e.browser.client
			.executeAsync(done => {
				const rep = window.dashboardApi.Replicant('client_schemaArrayMutatorPass');
				rep.once('declared', () => {
					rep.value.array.push('foo');
					rep.on('change', newVal => {
						if (newVal.array.length === 1) {
							done(rep.value);
						}
					});
				});
			})
			.then(ret => {
				assert.deepEqual(ret.value, {
					string: '',
					array: [
						'foo'
					]
				});
				done();
			})
			.catch(err => done(err));
	});

	it('should throw on invalid array mutation via array mutator methods', done => {
		e.browser.client
			.executeAsync(done => {
				const rep = window.dashboardApi.Replicant('client_schemaArrayMutatorFail');
				rep.once('declared', () => {
					try {
						rep.value.array.push(0);
					} catch (e) {
						done(e.message);
					}
				});
			})
			.then(ret => {
				assert.isTrue(ret.value.startsWith('Invalid value for replicant "client_schemaArrayMutatorFail"'));
				done();
			})
			.catch(err => done(err));
	});

	it('should accept valid property changes to arrays', done => {
		e.browser.client
			.executeAsync(done => {
				const rep = window.dashboardApi.Replicant('client_schemaArrayChangePass');
				rep.once('declared', () => {
					rep.value.array[0] = 'bar';
					rep.on('change', newVal => {
						if (newVal.array[0] === 'bar') {
							done(rep.value);
						}
					});
				});
			})
			.then(ret => {
				assert.deepEqual(ret.value, {
					string: '',
					array: [
						'bar'
					]
				});
				done();
			})
			.catch(err => done(err));
	});

	it('should throw on invalid property changes to arrays', done => {
		e.browser.client
			.executeAsync(done => {
				const rep = window.dashboardApi.Replicant('client_schemaArrayChangeFail');
				rep.once('declared', () => {
					try {
						rep.value.array[0] = 0;
					} catch (e) {
						done(e.message);
					}
				});
			})
			.then(ret => {
				assert.isTrue(ret.value.startsWith('Invalid value for replicant "client_schemaArrayChangeFail"'));
				done();
			})
			.catch(err => done(err));
	});

	it('should accept valid property changes to objects', done => {
		e.browser.client
			.executeAsync(done => {
				const rep = window.dashboardApi.Replicant('client_schemaObjectChangePass');
				rep.once('declared', () => {
					rep.value.object.numA = 1;
					rep.on('change', newVal => {
						if (newVal.object.numA === 1) {
							done(rep.value);
						}
					});
				});
			})
			.then(ret => {
				assert.deepEqual(ret.value, {
					string: '',
					object: {
						numA: 1
					}
				});
				done();
			})
			.catch(err => done(err));
	});

	it('should throw on invalid property changes to objects', done => {
		e.browser.client
			.executeAsync(done => {
				const rep = window.dashboardApi.Replicant('client_schemaObjectChangeFail');
				rep.once('declared', () => {
					try {
						rep.value.object.numA = 'foo';
					} catch (e) {
						done(e.message);
					}
				});
			})
			.then(ret => {
				assert.isTrue(ret.value.startsWith('Invalid value for replicant "client_schemaObjectChangeFail"'));
				done();
			})
			.catch(err => done(err));
	});

	it('should reject assignment if it was validated against a different version of the schema', done => {
		e.browser.client
			.executeAsync(done => {
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

				window.errorOnce(event => {
					event.preventDefault();
					done(event.error.message);
				});
			})
			.then(ret => {
				assert.isTrue(ret.value.startsWith('Mismatched schema version, assignment rejected'));
				done();
			})
			.catch(err => done(err));
	});

	it('should reject operations if they were validated against a different version of the schema', done => {
		e.browser.client
			.executeAsync(done => {
				const rep = window.dashboardApi.Replicant('client_schemaOperationMismatch');
				rep.once('declared', () => {
					rep.schemaSum = 'baz';
					try {
						rep.value.object.numA = 1;
					} catch (e) {
						done(e.message);
					}
				});

				window.errorOnce(event => {
					event.preventDefault();
					done(event.error.message);
				});
			})
			.then(ret => {
				assert.isTrue(ret.value.startsWith('Mismatched schema version, assignment rejected'));
				done();
			})
			.catch(err => done(err));
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
			const rep = e.apis.extension.Replicant('schema3', {
				defaultValue: {
					string: 0
				}
			});
			console.log(rep.schema);
			console.log(rep.schemaSum);
			console.log(rep.value);
		}, /Invalid value for replicant/);
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
		}, /Invalid value for replicant/);
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
		}, /Invalid value for replicant/);
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
		}, /Invalid value for replicant/);
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
		}, /Invalid value for replicant/);
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
		}, /Invalid value for replicant/);
	});
});
