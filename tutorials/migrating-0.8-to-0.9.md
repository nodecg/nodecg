## Breaking Changes
- [Dashboard Panel, Graphics, and Bower Components routes have changed](#routing-changes)
- [Most default styles and classes injected into Panels have been removed](#removed-default-styles)
- [Errors sent to sendMessage acknowledgements (callbacks) will be properly serialized](#ack-errors)
- [`npm` and `bower` dependencies are no longer automatically installed](#no-auto-deps)
- [Removed Rollbar integration, replaced it with Sentry](#removed-rollbar-added-sentry)

<h3 id="routing-changes">Routing Changes</h3>

NodeCG's routing has always been a little arbitrary and confusing. It did not match the structure of the filesystem, and there wasn't really a good reason for this. This arbitrary routing structure was hard to remember and prevented bundle authors from taking advantage of their IDE's autocomplete functionality. It also made using filesystem-aware tools like the [`polymer-bundler`](https://github.com/Polymer/polymer-bundler) (formerly called `vulcanize`) needlessly difficult.

The new routing structure matches the structure of the filesystem, making routes easier to work with and avoiding certain bugs relating to the de-duplication of HTML Imports (and soon, ES Modules).

Old (don't use these anymore!):
```
/panels/my-bundle/panel.html
/graphics/my-bundle/graphic.html

# Two different routes to the same file! This breaks the de-duplication of HTML Imports and causes errors.
/panels/my-bundle/components/polymer/polymer.html
/graphics/my-bundle/components/polymer/polymer.html
```

New:
```
/bundles/my-bundle/dashboard/panel.html
/bundles/my-bundle/graphics/graphic.html

# Now, there is only one single route to any given file.
/bundles/my-bundle/bower_components/polymer/polymer.html
```

<h3 id="removed-default-styles">Removed Default Styles</h3>

Up until now, NodeCG has injected some default styles and helper classes into each and every panel. The idea was to provide a set of base styles that every bundle author could use to try to create a cohesive NodeCG panel design across all bundles.

However, this set of styles was far too small and limited to achieve that, and upon further reflection we decided that NodeCG core was not the place to attempt to accomplish this. Additionally, it's possible for these injected styles to cause frustrating conflicts.

NodeCG _does_ still inject a few default styles, but the number of styles has been dramatically reduced to just a few necessary things, such as the background color for panels. And, as always, this value can be easily overridden in your panel's CSS.

If your panels relied on any of these default styles or helper classes such as `nodecg-configure`, you will need to manually specify new styles instead.

<h3 id="ack-errors">sendMessage acknowledgement Errors</h3>

In the past, if you tried to reply to a `sendMessage` with an `Error`, you'd end up with just an empty Object at the other end (`{}`). This is because by default, JavaScript `Error`s are serialized as an empty Object by `JSON.stringify`.

Now, if the first argument to a {@link NodeCG#sendMessage}  acknowledgement is an error, it will be properly serialized and sent across the wire. As part of this, we are now strongly encouraging that all {@link NodeCG#sendMessage} acknowledgements always be treated as standard error-first Node.js-style callbacks.

In addition, client-side {@link NodeCG#sendMessage}  now also returns a `Promise`, so that you may use `.then`/`.catch` instead of a callback function. See the updated {@link NodeCG#sendMessage} documentation for more information.

Please note that if you do not specify a callback to your `sendMessage`, then it will always return a Promise. Additionally, the first argument sent back in your acknowledgement is always assumed to be either an `Error` or `null`. If this value is truthy, then it will be used to `reject` the Promise. For this reason, it is strongly encouraged that all `sendMessage` acknowledgements strictly adhere to the error-first style of callbacks.

<h3 id="no-auto-deps">No Auto-Installation of Dependencies</h3>

Since the earliest versions of NodeCG, it has attempted to be helpful by automatically running both `npm install --production` and `bower install` on every installed bundle, every time you started up NodeCG. While some users may have found this helpful, over time we've come to realize that this was a misguided decision, and that installation of each bundle's dependencies should really be left to the user.

The main rationale for the removal of this feature is that there's a lot more package managers out there than just `npm` and `bower`, and it's not reasonable for NodeCG to know about every single one of them and to be able to properly invoke them. The auto-dependency installation system made a lot of assumptions, and it's going to become more and more frequent that these assumptions just aren't valid. For example, if a bundle doesn't have a `bower.json`, then running `bower install` on it would actually have unintended side-effects. This is just one example that is easy to fix on its own, but there are many such examples of odd side-effects and unintended consequences of this automatic installation behavior. Together, they paint a clear picture that this feature was misguided, and should be removed.

Going forward, users will always need to manually run whatever dependency installation steps are required by the bundle in question. For most bundles, this still means just running `npm install --production && bower install`, but this will not always be the case. Each bundle will need to add their dependency installation steps to their READMEs, and make sure that users are educated in the fact that pulling down new updates to a bundle means that they may need to also install updated dependencies. 

<h3 id="removed-rollbar-added-sentry">Removed Rollbar integration, replaced it with Sentry</h3>

In NodeCG v0.8, we introduced a first-class integration with the Rollbar error tracking service. This was very helpful and made NodeCG safer to use in production, but we were unhappy with the level of service and features that Rollbar provided. In NodeCG v0.9, we have removed the Rollbar integration and replaced it with a Sentry integration. See the [Sentry tutorial]{@tutorial sentry} for more info on how to set up Sentry in your NodeCG deployment.
