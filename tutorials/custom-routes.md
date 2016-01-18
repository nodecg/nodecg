NodeCG uses [express](http://expressjs.com/) for its routing.
Extensions can make their own express apps, and mount them via {@link NodeCG#mount}:

```javascript
// bundles/my-bundle/extension.js
var express = require('express');
var app = express();

module.exports = function(nodecg) {
    app.get('/my-bundle/customroute', function(req, res) {
      res.send('OK!');
    });

    nodecg.mount(app); // The route '/my-bundle/customroute` is now available
};
```
