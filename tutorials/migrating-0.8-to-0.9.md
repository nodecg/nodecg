## Breaking Changes
- [Dashboard Panel, Graphics, and Bower Components routes have changed](#routing-changes)
- [Errors sent to sendMessage acknowledgements (callbacks) will be properly serialized](#ack-errors)

<h3 id="routing-changes">Routing Changes</h3>
NodeCG's routing has always been a little arbitrary and confusing. It did not match the structure of the filesystem,
and there wasn't really a good reason for this. This arbitrary routing structure was hard to remember and 
prevented bundle authors from taking advantage of their IDE's autocomplete functionality. It also made using
filesystem-aware tools like the [`polymer-bundler`](https://github.com/Polymer/polymer-bundler) 
(formerly called `vulcanize`) needlessly difficult.

The new routing structure matches the structure of the filesystem, making routes easier to work with
and avoiding certain bugs relating to the de-duplication of HTML Imports (and soon, ES Modules).

Old (don't use these anymore!):
```
/panels/my-bundle/panel.html
/graphics/my-bundle/graphic.html

# Two different routes to the same file! This breaks the de-duplication of HTML Imports and causes errors.
/panels/my-bundle/components/polymer/polymer.html
/graphics/my-bundlecomponents/polymer/polymer.html
```

New:
```
/bundles/my-bundle/dashboard/panel.html
/bundles/my-bundle/graphics/graphic.html

# Now, there is only one single route to any given file.
/bundles/my-bundle/bower_components/polymer/polymer.html
```

<h3 id="ack-errors">sendMessage acknowledgement Errors</h3>

In the past, if you tried to reply to a `sendMessage` with an `Error`, you'd end up with just an empty Object
at the other end (`{}`). This is because by default, JavaScript `Error`s are serialized as an empty Object
by `JSON.stringify`.

Now, if the first argument to a {@link NodeCG#sendMessage}  acknowledgement is an error, it will be properly serialized
and sent across the wire. As part of this, we are now strongly encouraging that all {@link NodeCG#sendMessage} acknowledgements
always be treated as standard error-first Node.js-style callbacks.

In addition, client-side {@link NodeCG#sendMessage}  now also returns a `Promise`, so that you may use `.then`/`.catch` instead
of a callback function. See the updated {@link NodeCG#sendMessage} documentation for more information.
