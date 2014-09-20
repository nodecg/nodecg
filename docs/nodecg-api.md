#Using NodeCG's Javascript API
Dashboard panels and views have access to a Javascript API, allowing them to send messages to each other.  
Generally, an admin panel will send a message when a button is pressed, and the view will 'listen' for that message.  
An example is given below, and further examples can be found in the [samples repository](https://github.com/nodecg/nodecg-samples).

##Accessing the API
In dashboard panels, all of your .js files will have access to a `nodecg` object.  
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

##Sending a message
Messages have a name, and an optional object containing any additional information you require.
```javascript
nodecg.sendMessage(String messageName[, Object customData]);
```

##Listening for messages
When a message is received, it fires a function which you define.  
Note that you can also listen to messages from other bundles, with an optional parameter.
```javascript
nodecg.listenFor(String messageName[, String bundleName], function messageHandler(data));
```

##Examples
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
