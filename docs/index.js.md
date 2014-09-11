#What does an index.js file do in a bundle?
It lets you extend the core of NodeCG, adding nearly any additional functionality that your bundle may need.
An index.js file _must export an express app_, like this:

````javascript
var express = require('express'),
    app = module.exports = express(),
    config = require('../../config.js');

app.get('/view/mybundle/customroute', function(req, res) {
  res.render(__dirname + 'somefile.jade', {host: config.host, port: config.port});
});
````

#What if my bundle relies on a npm package that NodeCG doesn't have?
You can use [squirrel](https://github.com/DamonOehlman/squirrel) to lazy-install and lazy-load any npm package that your bundle(s) need:
````javascript
var express = require('express'),
    app = module.exports = express(),
    config = require('../../config.js'),
    squirrel = require('squirrel);

squirrel('jsdom', function(err, jsdom) {
  app.get('/view/mybundle', function(req, res) {
    //do something that requires jsdom
  });
});
````