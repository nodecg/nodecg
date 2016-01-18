Any npm dependencies defined in your bundle's `package.json` will be automatically installed by NodeCG on startup.
Extensions can then access these dependencies directly, via normal `require` statements:

`bundles/my-bundle/package.json`
```json
{
    "name": "my-bundle"
    ...
    "dependencies": {
        "some-dep": "^1.0.0"
    }
}
```

`bundles/my-bundle/extension.js`
```js
var someDep = require('some-dep');

module.exports = function(nodecg) {
    // I can use someDep whenever I want!
}
```
