import path from "path";
import { expect } from "vitest";

import { setupTest } from "../helpers/setup";

const test = await setupTest();

test("should create a default value based on the schema, if none is provided", ({
	apis,
}) => {
	const rep = apis.extension.Replicant("schema1");
	expect(rep.value).toEqual({
		string: "",
		object: {
			numA: 0,
		},
	});
});

test("should accept the defaultValue when it passes validation", ({ apis }) => {
	expect(() => {
		apis.extension.Replicant("schema2", {
			defaultValue: {
				string: "foo",
				object: {
					numA: 1,
				},
			},
		});
	}).not.toThrow();
});

test("should throw when defaultValue fails validation", ({ apis }) => {
	expect(() => {
		apis.extension.Replicant("schema3", {
			defaultValue: {
				string: 0,
			},
		});
	}).toThrowErrorMatchingInlineSnapshot(`
		[Error: Invalid value rejected for replicant "schema3" in namespace "test-bundle":
		string must be string]
	`);
});

test("should accept the persisted value when it passes validation", ({
	apis,
}) => {
	// Persisted value is copied from fixtures
	const rep = apis.extension.Replicant("schemaPersistencePass");
	expect(rep.value).toEqual({
		string: "foo",
		object: {
			numA: 1,
		},
	});
});

test("should reject the persisted value when it fails validation, replacing with schemaDefaults", ({
	apis,
}) => {
	// Persisted value is copied from fixtures
	const rep = apis.extension.Replicant("schemaPersistenceFail");
	expect(rep.value).toEqual({
		string: "",
		object: {
			numA: 0,
		},
	});
});

test("should accept valid assignment", ({ apis }) => {
	expect(() => {
		const rep = apis.extension.Replicant("schemaAssignPass");
		rep.value = {
			string: "foo",
			object: {
				numA: 1,
			},
		};
	}).not.toThrow();
});

test("should throw on invalid assignment", ({ apis }) => {
	expect(() => {
		const rep = apis.extension.Replicant("schemaAssignFail");
		rep.value = {
			string: 0,
		};
	}).toThrowErrorMatchingInlineSnapshot(`
		[Error: Invalid value rejected for replicant "schemaAssignFail" in namespace "test-bundle":
		string must be string]
	`);
});

test("should accept valid property deletion", ({ apis }) => {
	expect(() => {
		const rep = apis.extension.Replicant<any>("schemaDeletionPass");
		delete rep.value.object.numB;
	}).not.toThrow();
});

test("should throw on invalid property deletion", ({ apis }) => {
	expect(() => {
		const rep = apis.extension.Replicant<any>("schemaDeletionFail");
		delete rep.value.object.numA;
	}).toThrowErrorMatchingInlineSnapshot(`
		[Error: Invalid value rejected for replicant "schemaDeletionFail" in namespace "test-bundle":
		object must have required property 'numA']
	`);
});

test("should accept valid array mutation via array mutator methods", ({
	apis,
}) => {
	expect(() => {
		const rep = apis.extension.Replicant<any>("schemaArrayMutatorPass");
		rep.value.array.push("foo");
	}).not.toThrow();
});

test("should throw on invalid array mutation via array mutator methods", ({
	apis,
}) => {
	expect(() => {
		const rep = apis.extension.Replicant<any>("schemaArrayMutatorFail");
		rep.value.array.push(0);
	}).toThrowErrorMatchingInlineSnapshot(`
		[Error: Invalid value rejected for replicant "schemaArrayMutatorFail" in namespace "test-bundle":
		array/0 must be string]
	`);
});

test("should accept valid property changes to arrays", ({ apis }) => {
	expect(() => {
		const rep = apis.extension.Replicant<any>("schemaArrayChangePass");
		rep.value.array[0] = "bar";
	}).not.toThrow();
});

test("should throw on invalid property changes to arrays", ({ apis }) => {
	expect(() => {
		const rep = apis.extension.Replicant<any>("schemaArrayChangeFail");
		rep.value.array[0] = 0;
	}).toThrowErrorMatchingInlineSnapshot(`
		[Error: Invalid value rejected for replicant "schemaArrayChangeFail" in namespace "test-bundle":
		array/0 must be string]
	`);
});

test("should accept valid property changes to objects", ({ apis }) => {
	expect(() => {
		const rep = apis.extension.Replicant<any>("schemaObjectChangePass");
		rep.value.object.numA = 1;
	}).not.toThrow();
});

test("should throw on invalid property changes to objects", ({ apis }) => {
	expect(() => {
		const rep = apis.extension.Replicant<any>("schemaObjectChangeFail");
		rep.value.object.numA = "foo";
	}).toThrowErrorMatchingInlineSnapshot(`
		[Error: Invalid value rejected for replicant "schemaObjectChangeFail" in namespace "test-bundle":
		object/numA must be number]
	`);
});

test("should properly load schemas provided with an absolute path", ({
	apis,
}) => {
	const rep = apis.extension.Replicant("schemaAbsolutePath", {
		schemaPath: path.resolve(
			__dirname,
			"../fixtures/nodecg-core/absolute-path-schemas/schemaAbsolutePath.json",
		),
	});

	expect(rep.schema).toEqual({
		string: "",
		object: {
			numA: 0,
		},
	});
});

test("supports local file $refs", ({ apis }) => {
	const rep = apis.extension.Replicant("schemaWithRef");
	expect(rep.schema).toMatchInlineSnapshot(`
		{
		  "$schema": "http://json-schema.org/draft-07/schema",
		  "properties": {
		    "object": {
		      "additionalProperties": false,
		      "properties": {
		        "hasDeepRef": {
		          "properties": {
		            "numA": {
		              "default": 0,
		              "type": "number",
		            },
		          },
		          "type": "object",
		        },
		        "hasFileRefThenDefRef": {
		          "enum": [
		            "foo",
		            "bar",
		          ],
		          "type": "string",
		        },
		        "numA": {
		          "default": 0,
		          "type": "number",
		        },
		      },
		      "type": "object",
		    },
		    "string": {
		      "default": "",
		      "type": "string",
		    },
		  },
		  "type": "object",
		}
	`);
});

test("supports internal $refs", ({ apis }) => {
	const rep = apis.extension.Replicant("schemaWithInternalRef");
	expect(rep.schema).toMatchInlineSnapshot(`
		{
		  "$schema": "http://json-schema.org/draft-07/schema",
		  "definitions": {
		    "hasDeepRef": {
		      "properties": {
		        "numA": {
		          "default": 0,
		          "type": "number",
		        },
		      },
		      "type": "object",
		    },
		    "numA": {
		      "default": 0,
		      "type": "number",
		    },
		  },
		  "properties": {
		    "object": {
		      "additionalProperties": false,
		      "properties": {
		        "hasDeepRef": {
		          "properties": {
		            "numA": {
		              "default": 0,
		              "type": "number",
		            },
		          },
		          "type": "object",
		        },
		        "numA": {
		          "default": 0,
		          "type": "number",
		        },
		      },
		      "type": "object",
		    },
		    "string": {
		      "default": "",
		      "type": "string",
		    },
		  },
		  "type": "object",
		}
	`);
});
