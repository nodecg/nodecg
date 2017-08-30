NodeCG has a few main concepts to understand in order to get the most out of it and understand what a bundle is doing:

1. [Graphics](#graphics)
2. [Dashboard](#dashboard)
3. [Extensions](#extensions)
4. [Messages](#messages)
5. [Replicants](#replicants)

## Graphics ##
Graphics are the end result that your viewers will see. NodeCG itself doesn't provide any libraries for drawing pixels, it instead lets the user decide how they want to create their graphics in the open framework of HTML5, CSS3, and ES6. Graphics are defined in your bundle's `package.json` file in the `graphics` section with a few simple properties:
  - `file`, the HTML file to be served.
  - `width` and `height`, which defines the dimensions of your graphic.
  - `singleInstance`, an optional property, that only allows your graphic to be open in one place at a time.

## Dashboard ##
The dashboard is where all your controls for your graphics end up. Each panel is it's own self-contained webpage, and has full access to the NodeCG API. They are defined in your bundle's `package.json` file in the `dashboardPanels` section with a few properties:
  - `name`, the internal name of your panel.
  - `title`, the title displayed on the NodeCG workspace.
  - `file`, the HTML file to be served.
  - `width`, an optional property, the amount of space the bundle takes up on the page. Width scaling is abitrary and is subject to change, play around with it.
  - `headerColor`, an optional property, that will change the color of the panel's header to a provided hexadecimal color value.
  - `workspace`, an optional property, that when set will place the panel into a new workspace with the name provided. These workspaces can be shared between bundles.
  - `fullbleed`, an optional property, that when set to true will place the panel in it's own workplace at the maximum possible width and height with no margins.
  - `dialog`, an optional property, that will turn the panel into a dialog that other panels are able to open. 
  - `dialogButtons`, an optional property, that will show a `confirm`, `dismiss`, or both options on the dialog.

## Extensions ##
Extensions are the back-end portion of your graphics, typically handling all the potential messy logic that your graphics might want to display, such as donations or schedule handling. NodeCG will try and `require` your bundle's `extensions` folder, so if used an index.js file is needed.

Not all bundles might require an extension to back them up, but you should consider them if your graphics might be handling any API work.

## Messages ##
Messages are the way NodeCG lets extensions, dashboard panels, and the graphics communicate with each other seamlessly. A message can be anything, from an array to an object to a string, as long as it can be represented in Javascript, you can send it. All you have to do is call `nodecg.sendMessage` on one end and `nodecg.listenFor` on another!

## Replicants ##
Replicants are how NodeCG stores and replicates data between extensions, dashboard panels, and graphics. Rather than being events like [messages](#messages) are, Replicants (optionally) persistent.

Replicants on server-side extensions are able to be read synchronously, as NodeCG has immediate access to the database of replicants, but in dashboard panels and graphics you should read Replicants asynchronously by listening for the `change` event.