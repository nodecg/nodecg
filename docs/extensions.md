#Creating NodeCG Extensions
An extension is any bundle code that runs on the server (the NodeJS environment) and not on the client (the browser).
Extensions let you extend the core of NodeCG, adding nearly any additional functionality that your bundle may need.
Extensions are _always_ singletons. They are `require`d once by the core of NodeCG, then cached.
To access the NodeCG API, your extension _must_ export a function that accepts a single argument, that argument being an instance of the NodeCG API.

##Extension template
```javascript
// nodecg/bundles/my-bundle/index.js
// 'nodecg` is injected by the core of NodeCG
module.exports = function(nodecg) {
    // Declare a synced var
    nodecg.declareSyncedVar({ variableName: 'myVar', initialVal: 123 });

    // Listen for a message
    nodecg.listenFor('myMessage', myCallback);
};

function myCallback(data, callback) {
    console.log(data);

    // If the client supplied a callback, uncomment this to invoke it
    /*  var response = 'acknowledged';
     callback(response);
     */
}
```

##FAQ
###How do I load my bundle's extension?
Your bundle's [nodecg.json](nodecg.json.md) must have the `extension` property.

###How can I access another bundle's extension?
First, you _must_ declare that bundle as a `bundleDependency` in your [nodecg.json](nodecg.json.md).
Then, you may access that bundle's extension via `nodecg.extensions[bundle-name]`.

###How can I define a custom route for my bundle?
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
  app.get('/mybundle/customroute', function(req, res) {
    //do something that requires jsdom
  });
});
````
