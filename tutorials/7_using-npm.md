> ❗ As of NodeCG v0.9, per-bundle `bower` and `npm` dependencies are no longer automatically installed. It is up to the user to run whatever installation commands are necessary in each bundle.

Install `npm` dependencies as you would in any other Node.js project. Extensions can then access these dependencies directly, via normal `require` statements:

`bundles/my-bundle/package.json`
```json
{
    "name": "my-bundle",
    ...
    "dependencies": {
        "some-dep": "^1.0.0"
    }
}
```

`bundles/my-bundle/extension.js`
```js
const someDep = require('some-dep');

module.exports = function (nodecg) {
    // I can use someDep whenever I want!
}
```
