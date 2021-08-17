As of 0.8.4, bundle authors may define an optional schema for the [Replicants]{@link NodeCG#Replicant} in their bundle.
If present, NodeCG will validate every change made to the Replicant against this schema. 
If any change fails validation, either on the server or on the client, an error will be synchronously thrown.

All schemas are in the [JSON Schema](http://json-schema.org/) format. To add a schema to a Replicant, 
create a `.json` file with the same name as your Replicant in your bundle's `schemas` folder. For example, 
if `my-bundle` has a Replicant called `foo`, the schema would be located at `nodecg/bundles/my-bundle/schemas/foo.json`. 
NodeCG will automatically see and load this schema on startup. Changes to the schema require restarting NodeCG.

If a Replicant's schema has defaults defined, NodeCG will use those defaults to automatically build a `defaultValue`
for the Replicant. This auto-generated `defaultValue` is overridden by any `defaultValue` that is provided during Replicant
declaration.

If for any reason a Replicant's persisted value becomes invalid, NodeCG will discard this value on startup.

## Example
`nodecg/bundles/my-bundle/schemas/foo.json`
```
{
	"$schema": "http://json-schema.org/draft-07/schema",
	"type": "object",
	"additionalProperties": false,
	"properties": {
		"bar": {
			"type": "string",
			"description": "The value of bar, which is a String.",
			"default": "hello world"
		},
		"baz": {
			"type": "number",
			"description": "The value of baz, which is a Number.",
			"default": "0"
		}
	},
	"required": ["bar", "baz"]
}
```

`nodecg/bundles/my-bundle/extension.js`
```
module.exports = function (nodecg) {
	// We don't need to specify a `defaultValue` here, it will be automatically generated from the defaults
	// in the schema.
	const foo = nodecg.Replicant('foo');
	
	/* You can override this by specifying your own `defaultValue` when declaring the Replicant.
	const foo = nodecg.Replicant('foo', {
		defaultValue: {
			bar: "hi",
			baz: 5
		}
	}); */
	
	console.log(foo.value.bar); //=> "hello world"
	console.log(foo.value.baz); //=> 0
	
	foo.value.bar = "greetings planet"; // Valid change, no error will be thrown.
	foo.value.baz = "this should be a number!"; // Invalid change, an error will be thrown.
};
```
