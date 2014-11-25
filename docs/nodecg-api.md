#Using NodeCG's Javascript API
Dashboard panels, views, and extensions have access to a Javascript API, allowing them to send messages to each other.
Generally, an admin panel will send a message when a button is pressed, and the view will 'listen' for that message.
An example is given below, and further examples can be found in the [samples repository](https://github.com/nodecg/nodecg-samples).

##Accessing the API
###From the dashboard
In dashboard panels, all of your .js files will have access to a `nodecg` object, without the need for any extra code.

###From a view
In views, you must include `<script src="/viewsetup.js"></script>` at the bottom of your body tag, and you must wrap your Javascript as below:
```javascript
$(document).on('ncgReady', function() {
  //I can use the nodecg object now!
  nodecg.listenFor...
}

//alternatively, without using jQuery
document.addEventListener("ncgReady", function() {
  ...
}
```
This is to ensure the scripts NodeCG depends on are loaded and configured before the view attempts to use the API.

###From an extension
If your extension meets the [NodeCG extension specification](extensions.md), it will have access to a `nodecg` object, without the need for any extra code.


##Messages
NodeCG allows for events to be fired/heard from not only the server, but any and all clients.

###Listening for messages
When a message is received, it fires a function which you define.
Note that you can also listen to messages from other bundles, with an optional parameter.
```javascript
nodecg.listenFor(String messageName[, String bundleName], function messageHandler(data));
```

###Sending a message
Messages have a name, an optional object containing any additional information you require, and an optional callback.
Callbacks are not automatically invoked. They must be explicitly called by some piece of extension code [(Example)](extensions.md#invoking-a-callback-supplied-by-nodecgsendmessage).
```javascript
nodecg.sendMessage(String messageName[, Object customData, function callback]);
```
You can also send a message to another bundle.
```javascript
nodecg.sendMessageToBundle(String messageName, String bundleName[, Object customData, function callback]);
```

###Invoking a callback supplied by nodecg.sendMessage
Bundles may need to supply a callback to their [sendMessage](nodecg-api.md#sending-a-message) operations.
For these callbacks to work, there must be code in place to invoke them.
````javascript
var myData = { name: 'Geoff' };

nodecg.listenFor('myMessage', function(data, callback) {
    callback(myData);
);
````

###Examples
To send a message within your bundle, the following calls are valid
```javascript
nodecg.sendMessage('startAnimation', {duration: 10});
nodecg.sendMessage('hideAnimation');
```
You *can not* send a message to another bundle directly, it must listen for your messages.

To listen for a message in your own bundle
```javascript
nodecg.listenFor('startAnimation', startMyAnimation);
function startMyAnimation(data) {
  console.log("animation duration: " + data.duration);
  ...
}

nodecg.listenFor('hideAnimation', function() { ... });
```

To listen to messages in another bundle, for example, a shared helper bundle
```javascript
nodecg.listenFor('sharedMessage', 'another-bundle', myHandler);
```

##Synced Variables
Synced variables are data that is replicated on the server and across all clients. Any time a synced variable changes,
it triggers callbacks specified by every instance of that variable. This effectively provides full-stack data binding for bundles,
allowing data to always be in sync and for bundles to react to changes in that data.

###Declaring a synced variable
If the variable has already been declared, this will not overwrite the existing var.
To access a var from a given NodeCG API instance, it _must_ first be declared by that instance, even if another instance has already declared it.

NOTE: As of this writing, it is not possible for a NodeCG API instance to listen to two variables of the same name, even if they belong to two different bundles.
This is because variables are accessed via `nodecg.variables[variable-name]`, with no respect to the bundle name. This may change in the future.

```javascript
nodecg.declareSyncedVar({
  variableName: 'myVar',
  bundleName: 'my-bundle', //optional, defaults to the name of the current bundle. can be used to listen to another bundle's variable
  initialVal: 123, //optional, specifies an initial val to set the variable to if it doesn't yet exist
  setter: function(newVal) {} // callback fired whenever the value of this variable changes
})
```

###Accessing a synced variable
Most operations that need to access the value of a synced variable are best done from that variable's `setter`.
However, in some cases it may be necessary to access the value directly.
A synced variable may only be accessed after it has been declared by the given instance of the NodeCG API.
```javascript
var value = nodecg.variables.myVar; // value = 123
```

###Caveats
Currently, syncedVars do not handle objects or arrays well.

For example, `nodecg.variables.myArray.push('data')` will break the variable, as it replaces `nodecg.variables.myArray` with a new array object.
Likewise, setting a property such as `nodecg.variables.myObject.a = 'data'` will not propogate throughout the stack and will not trigger the appropriate `setter` functions.
We realize how silly of a limitation this is, and are brainstorming how to best rectify it. We are currently examining the proposed [`Object.observe`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe) property as a future solution.

## Utility functions
The NodeCG API offers a number of utility functions.

###Config
The NodeCG config can be read via `nodecg.config`.
This property is read-only, and has sentitive information such as API keys filtered out.

###util.authCheck
Checks if a user is logged in, may only be used in express routes.
```javascript
// only logged in users may access this route
app.get('/secreturl', nodecg.util.authCheck, function(req, res) {
    res.send("congrats, you're logged in");
});
```