NodeCG uses [express](http://expressjs.com/) for its routing.
Extensions can make their own express apps, and mount them via {@link NodeCG#mount}:

```javascript
// bundles/my-bundle/extension.js
const express = require('express');
const app = express();

module.exports = function (nodecg) {
    app.get('/my-bundle/customroute', (req, res) => {
        res.send('OK!');
    });

    nodecg.mount(app); // The route '/my-bundle/customroute` is now available
};
```

You can also define a prefix path so that the routes will be relative to it:

```javascript
// bundles/my-bundle/extension.js
const express = require('express');
const app = express();

module.exports = function (nodecg) {
    app.get('/customroute', (req, res) => {
        res.send('OK!');
    });

    nodecg.mount('/my-bundle', app); // The route '/my-bundle/customroute` is now available
};
```
