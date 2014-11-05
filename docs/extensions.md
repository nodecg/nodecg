###What is an extension?
An extension is any bundle code that runs on the server (the NodeJS environment) and not on the client (the browser).
Extensions let you extend the core of NodeCG, adding nearly any additional functionality that your bundle may need.
Extensions can export any module, but don't __have__ to export anything if they do not need to.

###How do I load my bundle's extension?
Your bundle's [nodecg.json](nodecg.json.md) must have the `extension` property.

###What if my extension needs to define a route?
If an extension exports an express app, it will automatically be mounted.
Below is an example of an extension exporting an express app:

````javascript
var express = require('express'),
    app = module.exports = express();

app.get('/mybundle/customroute', function(req, res) {
  res.render(__dirname + 'somefile.jade', {name: "Some test data!", age: 23});
});
````

###What if my bundle's extension relies on a npm package that NodeCG doesn't have?
You can use [squirrel](https://github.com/DamonOehlman/squirrel) to lazy-install and lazy-load any npm package that your bundle(s) need:
````javascript
var express = require('express'),
    app = module.exports = express(),
    squirrel = require('squirrel');

squirrel('jsdom', function(err, jsdom) {
  app.get('/view/mybundle', function(req, res) {
    //do something that requires jsdom
  });
});
````
