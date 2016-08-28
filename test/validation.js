/* eslint-env node, mocha, browser */
'use strict';

const chai = require('chai');
const assert = chai.assert;
const e = require('./setup/test-environment');

describe('server-side replicants', () => {
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

	});

	it('should throw on invalid assignment', () => {

	});

	it('should accept valid property deletion', () => {

	});

	it('should throw on invalid property deletion', () => {

	});

	it('should accept valid array mutation via array mutator methods', () => {

	});

	it('should throw on invalid array mutation via array mutator methods', () => {

	});

	it('should accept valid property changes', () => {

	});

	it('should throw on invalid property changes', () => {

	});

	it('should accept valid property additions', () => {

	});

	it('should throw on invalid property additions', () => {

	});
});
