Bundles can be configured via *.json config files in the `cfg` directory of NodeCG.

##Example
Say we have a bundle named `test-bundle`. If we create`./cfg/test-bundle.json` with the following contents:
```json
{ 
    "myData": "hello"
}
```

... that data can be accessed from via {@link NodeCG#bundleConfig}:
```js
console.log(nodecg.bundleConfig.myData); // prints "hello"
```

## JSON Schema
If your bundle has a `configschema.json` file in its root, NodeCG will validate the config file (if any) for your bundle
against this JSON Schema, and will throw errors on startup if the config file fails to pass validation. This is often
the most efficient way to enforce a specific structure for your bundle's config.

See [_Understanding JSON Schema_](http://spacetelescope.github.io/understanding-json-schema/) 
for more information on what a JSON Schema is and how to use one.
