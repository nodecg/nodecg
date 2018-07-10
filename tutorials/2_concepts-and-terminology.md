NodeCG has a few main concepts to understand in order to get the most out of it and understand what a bundle is doing:

1. [Manifest](#manifest)
2. [Graphics](#graphics)
3. [Dashboard](#dashboard)
4. [Extensions](#extensions)
5. [Messages](#messages)
6. [Replicants](#replicants)

## Manifest
Every bundle needs a [`package.json`](https://docs.npmjs.com/files/package.json) manifest file in its root directory. In addition to the required fields like `name` and `version`, NodeCG bundles must also have a `nodecg` object in their `package.json` with some additional properties that tell NodeCG how to load your bundle.

### Related Docs
- {@tutorial manifest}

## Graphics
Graphics are the end result that your viewers will see. NodeCG itself doesn't provide any libraries for drawing pixels, it instead lets the user decide how they want to create their graphics in the open framework of HTML5, CSS3, and JS (with ES6 being fully supported). NodeCG will also helpfully inject an API instance into the global scope of your graphics, accessible as `window.nodecg` (or just `nodecg`) from your graphic's code.

Graphics are defined in your bundle's `package.json` file, in the `nodecg.graphics` section, with a few simple properties:
  - `file`, the relative path (from your bundle's root directory) to the HTML file to be served as a graphic.
    - Your graphics should all live in the `nodecg/your-bundle/graphics/` folder.
  - `width` and `height`, which defines the dimensions of your graphic.
    - Note that your graphic doesn't have to strictly adhere to these values, they're mostly for documentation of your bundle. NodeCG doesn't enforce these values.
  - `singleInstance`, an optional property, that only allows your graphic to be open in one place at a time.
    - This is useful in scenarios where your graphic has fragile or highly stateful logic.
    - Ideally, you'd never need to use `singleInstance`. However, it is sometimes hard to avoid, and can be the fastest route to shipping a complex graphic.
    
### Related Docs
- {@tutorial manifest}
- {@tutorial using-npm}
- {@tutorial using-bower}
- {@tutorial performance-tips}
- {@tutorial screenshot-testing}

## Dashboard
The dashboard is where all your controls for your graphics end up. Each panel is it's own self-contained webpage (displayed as an `<iframe>`), and has full access to the NodeCG API. Panels are defined in your bundle's `package.json` file in the `nodecg.dashboardPanels` section with a few properties:
  - `name`, the internal name of your panel.
  - `title`, the title displayed on the NodeCG workspace.
  - `file`, the relative path (from your bundle's root directory) to the HTML file to be served as a dashboard panel.
  - `width`, an optional property, the amount of space the bundle takes up on the page.
    - Valid values are `1-8`.
    - Width scaling is arbitrary and is subject to change, play around with it.
  - `headerColor`, an optional property, that will change the color of the panel's header to a provided hexadecimal color value.
    - Your `headerColor` must start with a `#` character. For example: `#f47425`.
  - `workspace`, an optional property, that when set will place the panel into a new workspace with the name provided. These workspaces can be shared between bundles.
  - `fullbleed`, an optional property, that when set to true will place the panel in it's own workplace at the maximum possible width and height with no margins.
    - Each `fullbleed` panel gets its own dedicated workspace.
  - `dialog`, an optional property, that will turn the panel into a dialog that other panels are able to open.
  - `dialogButtons`, an optional property, that will show buttons for `confirm`, `dismiss`, or both on the dialog.
  
### Related Docs
- {@tutorial manifest}
- {@tutorial making-dialogs}
- {@tutorial using-npm}
- {@tutorial using-bower}
- {@tutorial sounds}
- {@tutorial assets}

## Extensions
Extensions are the back-end portion of your graphics and dashboard panels, typically handling all the potential messy logic that your bundle may need to handle, such as donations or schedule handling. NodeCG will try and `require` your bundle's `extensions` folder, so if used an index.js file is needed. Each extension must export a function that accepts a NodeCG API instance as its first and only argument.

Not all bundles might require an extension to back them up, but you should consider one if your bundle might be handling any API work.

Example:
```js
// nodecg/bundles/your-bundle/extension.js
module.exports = nodecg => {
    nodecg.listenFor('foo', () => {
        console.log('bar');
    });
};
```

### Related Docs
- {@tutorial manifest}
- {@tutorial using-npm}
- {@tutorial bundle-configuration}
- {@tutorial custom-routes}
- {@tutorial mounts}

## Messages
Messages are the way NodeCG lets extensions, dashboard panels, and the graphics communicate with each other seamlessly. A message can be anything, from an array to an object to a string, as long as it can be represented in Javascript, you can send it. All you have to do is call `nodecg.sendMessage` on one end and `nodecg.listenFor` on another!

There is a limitation to this, however; a Message cannot be sent from server extension to server extension. In these cases, you will want to look into NodeJS's built in [EventEmitters](https://nodejs.org/dist/latest-v10.x/docs/api/events.html#events_class_eventemitter).

### Related Docs
- {@link NodeCG#sendMessage}
- {@link NodeCG#listenFor}

## Replicants
Replicants are how NodeCG stores and replicates data between extensions, dashboard panels, and graphics. Rather than being events like [messages](#messages) are, Replicants are (optionally) persistent.

Replicants on server-side extensions are able to be read synchronously, as NodeCG has immediate access to the database of replicants, but in dashboard panels and graphics you should read Replicants asynchronously by listening for the `change` event.

### Related Docs
- {@link NodeCG#Replicant}
- {@tutorial replicant-schemas}
