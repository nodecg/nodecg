###What is an extension?
An extension is any bundle code that runs on the server (the NodeJS environment) and not on the client (the browser).
Extensions let you extend the core of NodeCG, adding nearly any additional functionality that your bundle may need.
Extensions can export any module, but don't __have__ to export anything if they do not need to.

###How do I load my bundle's extension?
Your bundle's [nodecg.json](nodecg.json.md) must have the `extension` property.

###Using Socket.IO
As of this writing, there is no NodeCG API available to extensions. They must directly access NodeCG's Socket.IO instance and listen for messages.
A cleaner API for extensions is planned for a future release.
````javascript
var io = require('../../server.js'); // grab the main socket.io instance powering NodeCG
var myData = { name: 'Geoff' };

// Broadcasts to all open sockets.
io.sockets.json.send({
    bundleName: 'my-bundle',
    messageName: 'my-message',
    content: myData
});
````

###Invoking a callback supplied by nodecg.sendMessage
Bundles may need to supply a callback to their [sendMessage](nodecg-api.md#sending-a-message) operations. For these callbacks to work, there must be code in place to invoke them.
````javascript
var io = require('../../server.js'); // grab the main socket.io instance powering NodeCG
var myData = { name: 'Geoff' };

io.sockets.on('connection', function onConnection(socket) {
    socket.on('message', function onMessage(data, callback) {
        if (data.bundleName !== 'my-bundle') {
            return;
        }

        // When the view page loads, it will request some data
        if (data.messageName === 'getSomething') {
            callback(myData);
        }
    });
});
````

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
  app.get('/mybundle/customroute', function(req, res) {
    //do something that requires jsdom
  });
});
````
