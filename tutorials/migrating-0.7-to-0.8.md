## Breaking Changes
- [The order of arguments to the Replicant `change` event handler has been swapped](#replicant-change-event)
- [Dashboard panels are now served from `/panel/:bundleName/:panelFile` routes](#panel-routes)
- [Uploads have been renamed to Assets, now have Categories](#assets-and-categories)

<h3 id="replicant-change-event">Replicant Change Event</h3>
Prior to NodeCG v0.8, the Replicant change handler had the following signature:
```js
// NodeCG v0.7 and earlier
myRep.on('change', function (oldVal, newVal, changes) {});
```

In v0.8, `newVal` and `oldVal` have been swapped, as `newVal` is frequently used whereas `oldVal` is less frequently used.
```js
// NodeCG v0.8 and later
myRep.on('change', function (newVal, oldVal, operations) {});
```

<h3 id="panel-routes">Panel Routes</h3>
Dashboard panels are now served from `/panel/:bundleName/:panelFile` routes. Prior to v0.8, they were served from the
`/panel/:bundleName/:panelName` route.

This means that for a panel with the following declaration:
```json
{
  "name": "test",
  "title": "Test Panel",
  "width": 2,
  "file": "panel.html"
}
```
... the route to access this panel is now `/panel/test-bundle/panel.html` instead of `/panel/test-bundle/test`.

This also affects panels served from subfolders. Previously, the following panel:
```json
{
  "name": "test-dialog",
  "title": "Test Dialog",
  "width": 2,
  "file": "dialogs/test-dialog.html"
}
```
... would have been served from `/panel/test-bundle/test-dialog`. It is now served from `/panel/test-bundle/dialogs/test-dialog.html`.

If your panel or dialog is in a subfolder, you will need to update any relative links in your panel's HTML, CSS, and JS accordingly.
For example, if `test-dialog` were importing [`<paper-button>`](https://elements.polymer-project.org/elements/paper-button?view=demo:demo/index.html), 
the URL it uses would have to change:
```html
<!-- Won't work anymore. -->
<link rel="import" href="components/paper-button/paper-button.html">

<!-- Works with the new panel routes. -->
<link rel="import" href="../components/paper-button/paper-button.html">
```

<h3 id="assets-and-categories">Assets & Asset Categories</h3>
NodeCG v0.7.2 introduced the Uploads system. NodeCG v0.8 has renamed this system to "Assets", and introduces
the concept of categories. See the [Assets tutorial]{@tutorial assets} for more information on how to configure Assets for your bundle.
