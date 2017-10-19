'use strict';

// Packages
const path = require('path');
const test = require('ava');

// Ours
require('../helpers/nodecg-and-webdriver')(test); // Must be first.
const e = require('../helpers/test-environment');

test('should create a default value based on the schema, if none is provided', t => {
	const rep = e.apis.extension.Replicant('schema1');
	t.deepEqual(rep.value, {
		string: '',
		object: {
			numA: 0
		}
	});
});

test('should accept the defaultValue when it passes validation', t => {
	t.notThrows(() => {
		e.apis.extension.Replicant('schema2', {
			defaultValue: {
				string: 'foo',
				object: {
					numA: 1
				}
			}
		});
	});
});

test('should throw when defaultValue fails validation', t => {
	const error = t.throws(() => {
		e.apis.extension.Replicant('schema3', {
			defaultValue: {
				string: 0
			}
		});
	});

	t.true(error.message.includes('Invalid value rejected for replicant'));
});

test('should accept the persisted value when it passes validation', t => {
	// Persisted value is copied from fixtures
	const rep = e.apis.extension.Replicant('schemaPersistencePass');
	t.deepEqual(rep.value, {
		string: 'foo',
		object: {
			numA: 1
		}
	});
});

test('should reject the persisted value when it fails validation, replacing with schemaDefaults', t => {
	// Persisted value is copied from fixtures
	const rep = e.apis.extension.Replicant('schemaPersistenceFail');
	t.deepEqual(rep.value, {
		string: '',
		object: {
			numA: 0
		}
	});
});

test('should accept valid assignment', t => {
	t.notThrows(() => {
		const rep = e.apis.extension.Replicant('schemaAssignPass');
		rep.value = {
			string: 'foo',
			object: {
				numA: 1
			}
		};
	});
});

test('should throw on invalid assignment', t => {
	const error = t.throws(() => {
		const rep = e.apis.extension.Replicant('schemaAssignFail');
		rep.value = {
			string: 0
		};
	});

	t.true(error.message.includes('Invalid value rejected for replicant'));
});

test('should accept valid property deletion', t => {
	t.notThrows(() => {
		const rep = e.apis.extension.Replicant('schemaDeletionPass');
		delete rep.value.object.numB;
	});
});

test('should throw on invalid property deletion', t => {
	const error = t.throws(() => {
		const rep = e.apis.extension.Replicant('schemaDeletionFail');
		delete rep.value.object.numA;
	});

	t.true(error.message.includes('Invalid value rejected for replicant'));
});

test('should accept valid array mutation via array mutator methods', t => {
	t.notThrows(() => {
		const rep = e.apis.extension.Replicant('schemaArrayMutatorPass');
		rep.value.array.push('foo');
	});
});

test('should throw on invalid array mutation via array mutator methods', t => {
	const error = t.throws(() => {
		const rep = e.apis.extension.Replicant('schemaArrayMutatorFail');
		rep.value.array.push(0);
	});

	t.true(error.message.includes('Invalid value rejected for replicant'));
});

test('should accept valid property changes to arrays', t => {
	t.notThrows(() => {
		const rep = e.apis.extension.Replicant('schemaArrayChangePass');
		rep.value.array[0] = 'bar';
	});
});

test('should throw on invalid property changes to arrays', t => {
	const error = t.throws(() => {
		const rep = e.apis.extension.Replicant('schemaArrayChangeFail');
		rep.value.array[0] = 0;
	});

	t.true(error.message.includes('Invalid value rejected for replicant'));
});

test('should accept valid property changes to objects', t => {
	t.notThrows(() => {
		const rep = e.apis.extension.Replicant('schemaObjectChangePass');
		rep.value.object.numA = 1;
	});
});

test('should throw on invalid property changes to objects', t => {
	const error = t.throws(() => {
		const rep = e.apis.extension.Replicant('schemaObjectChangeFail');
		rep.value.object.numA = 'foo';
	});

	t.true(error.message.includes('Invalid value rejected for replicant'));
});

test('should properly load schemas provided with an absolute path', t => {
	const rep = e.apis.extension.Replicant('schemaAbsolutePath', {
		schemaPath: path.resolve(__dirname, '../fixtures/nodecg-core/absolute-path-schemas/schemaAbsolutePath.json')
	});

	t.deepEqual(rep.value, {
		string: '',
		object: {
			numA: 0
		}
	});
});

test('supports local file $refs', t => {
	const rep = e.apis.extension.Replicant('schemaWithRef');
	t.deepEqual(rep.schema, {
		$schema: 'http://json-schema.org/draft-04/schema#',
		type: 'object',
		properties: {
			string: {
				type: 'string',
				default: ''
			},
			object: {
				type: 'object',
				additionalProperties: false,
				properties: {
					numA: {
						type: 'number',
						default: 0
					},
					hasDeepRef: {
						type: 'object',
						properties: {
							numA: {
								type: 'number',
								default: 0
							}
						}
					}
				}
			}
		}
	});
});

test('supports internal $refs', t => {
	const rep = e.apis.extension.Replicant('schemaWithInternalRef');
	t.deepEqual(rep.schema, {
		$schema: 'http://json-schema.org/draft-04/schema#',
		definitions: {
			numA: {
				type: 'number',
				default: 0
			},
			hasDeepRef: {
				type: 'object',
				properties: {
					numA: {
						type: 'number',
						default: 0
					}
				}
			}
		},
		type: 'object',
		properties: {
			string: {
				type: 'string',
				default: ''
			},
			object: {
				type: 'object',
				additionalProperties: false,
				properties: {
					numA: {
						type: 'number',
						default: 0
					},
					hasDeepRef: {
						type: 'object',
						properties: {
							numA: {
								type: 'number',
								default: 0
							}
						}
					}
				}
			}
		}
	});
});
