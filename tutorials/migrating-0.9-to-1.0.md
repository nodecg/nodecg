## Breaking Changes
* [**dashboard**: The undocumented `[dialog-confirm]` and `[dialog-dismiss]` attribute click handlers have been removed.](#dialog-handlers)
* [**dashboard**: The undocumented (and broken) `panelClick` event has been removed.](#panel-click)
* [**sounds:** The undocumented customCues system has been removed.](#custom-cues)
* [**api:** A given context (server, client) can now declare multiple listenFor handlers for a given message. Handlers are called in the order they were registered.](#multiple-listeners)
* [**api:** sendMessage can now trigger listenFor handlers in the same context (extension, webpage, etc).](#intra-context-messaging)
* [**login:** Twitch auth now uses the "New Twitch API", instead of the deprecated "v5" API.](#twitch-api)

### <a name="dialog-handlers"></a> Undocumented `[dialog-confirm]` and `[dialog-dismiss]` attribute click handlers have been removed

Previously, NodeCG had an undocumented feature where _any_ element in a Dialog with a `[dialog-confirm]` or `[dialog-dismiss]` attribute would close the panel (with an appropriate `confirmed` or `dismissed` event) when clicked.

This undocumented feature has been removed. If your bundle relied on it, you will need to re-implement similar functionality in your bundle's code.

### <a name="panel-click"></a> Undocumented (and broken) `panelClick` event has been removed

Previously, NodeCG had an undocumented feature where any click even on any panel (or dialog) would emit a `panelClick` event on that panel's `document`.

This undocumented feature has been removed, and never really worked properly to begin with. If your bundle relied on it, you will need to re-implement similar functionality in your bundle's code.


### <a name="custom-cues"></a> Undocumented customCues system has been removed

Previously, NodeCG had an undocumented and extremely complex feature for defining and editing Sound Cues during runtime.

This undocumented feature has been removed. If your bundle relied on it, you will need to re-implement similar functionality in your bundle's code.


### <a name="multiple-listeners"></a> Multiple listenFor handlers for a given message

Previously, NodeCG only allowed your bundle to specify one `listenFor` handler, per message, per context.

Now, NodeCG lets you define as many `listenFor` handlers as you want, for any message, in any location.

However, server-side `listenFor` handlers must be careful to not call an `acknowledgement` more than once:

```js
// nodecg/bundles/your-bundle
module.exports = function (nodecg) {
    nodecg.listenFor('example', (data, ack) => {
        if (ack && !ack.handled) {
            ack('foo');
        }
    });
};
```

```html
// nodecg/bundles/your-bundle/graphics/example.html
<script>
nodecg.sendMessage('example', 'hello', (error, response) => {
    console.log(response); // => Will log "foo".
});
</script>
```

Calling an `acknowledgement` more than once will throw an error.

In short: **most bundles won't need to change any of their code** to be compatible with this change, but you should give everything a once-over to make sure things aren't behaving unexpectedly due to this new behavior.

### <a name="intra-context-messaging"></a> sendMessage can now trigger listenFor handlers in the same context

Previously, NodeCG messages were inter-context only. That meant that they were _only_ sent out over the network, and were not sent to other listeners in the same process context (extension, graphic, panel, etc).

Now, NodeCG sends messages to every listener, regardless of location. This means that code like the following will now work as expected:

```js
// nodecg/bundles/your-bundle/extension.js
module.exports = function (nodecg) {
    nodecg.sendMessage('hello', 'Hi there!');
};
```

```js
// nodecg/bundles/my-bundle/extension.js
module.exports = function (nodecg) {
    nodecg.listenFor('hello', 'your-bundle', data => {
        console.log(data); // => Will print "Hi there!"
    });
}
```

A side-effect of this change is that it is no longer guaranteed that a server-side `listenFor` handler will receive an `acknowledgement` callback as its second argument. You should always check for the presence of an `acknowledgement` before attempting to call it:

```js
// nodecg/bundles/your-bundle
module.exports = function (nodecg) {
    nodecg.listenFor('example', (data, ack) => {
        if (ack && !ack.handled) {
            ack('foo');
        }
    });
};
```

### <a name="twitch-api"></a> Twitch auth now uses the "New Twitch API", instead of the deprecated "v5" API

Previously, NodeCG used the deprecated "v5" Twitch API.

Now, NodeCG uses the "New Twitch API". The only tangible result of this change for NodeCG is that the format of the `login.twitch.scope` config parameter has changed. Please see [https://dev.twitch.tv/docs/authentication/#scopes](https://dev.twitch.tv/docs/authentication/#scopes) for documentation on this new format.
