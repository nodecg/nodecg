Every bundle must have a [`package.json`](https://docs.npmjs.com/files/package.json). In addition to the required fields
like `name` and `version` outlined in that link, NodeCG bundles must also have a `nodecg` object in their `package.json`
with some additional properties that tell NodeCG about the bundle and how to load it.

The `nodecg` object in a bundle's `package.json` must follow this structure:

```
{
  "name": "example-bundle",
  ...
  "nodecg": {
    "compatibleRange": "~0.7.0",
    "bundleDependencies": {
      "other-bundle": "^1.2.1"
    },
    "dashboardPanels": [
      {
        "name": "sample-panel",
        "title": "Sample Panel",
        "width": 2,
        "headerColor": "#2d4e8a",
        "file": "sample-panel.html"
      },
      {
        "name": "sample-dialog",
        "title": "Sample Dialog",
        "width": 2,
        "dialog": true,
        "dialogButtons": [
          {
            "name": "save",
            "type": "confirm"
          },
          {
            "name": "cancel",
            "type": "dismiss"
          }
        ],
        "file": "sample-dialog.html"
      }
    ],
    "graphics": [
      {
        "file": "index.html",
        "width": 1280,
        "height": 720,
        "singleInstance": false
      }
    ]
  }
  ...
}
```

## nodecg.compatibleRange
A [semver](http://semver.org/) range that defines which version(s) of NodeCG this bundle is compatible with.
This bundle will not load in NodeCG versions outside the specified range.

This field is required.

## nodecg.bundleDependencies
Formatted identically to npm's `dependencies` field, but behaves differently.
Bundles declared as `bundleDependencies` are not automatically installed.
This field's only job is to ensure that dependant bundles are loaded first.
In the above example, `other-bundle` would be loaded before `example-bundle`, and if `other-bundle` fails to load
then so will `example-bundle`.

This field is only required if your bundle makes use of {@link NodeCG#extensions}.

## nodecg.dashboardPanels
An array of objects, each object describing an individual dashboard panel or dialog.
Every panel and dialog must have a `name`, `title`, and `file`. `file` is relative to the bundle's `dashboard` folder.
`width` is optional, and defaults to `2`. The width scale is arbitrary and may change, 
so you'll want to play around with this number to get the desired width.

Panels also have an optional `headerColor` property that accepts a hex color string.

To mark a panel as a dialog, it must have the `dialog` property set to `true`. Dialogs don't immediately display on the
dashboard, and must be manually invoked. ([Screenshot of an open dialog](http://i.imgur.com/xA4mDvF.png))

Dialogs have special buttons for confirmation and dismissal, which are defined in the `dialogButtons` property.
There are only two types of dialogButton: `confirm` and `dismiss`. When one of these buttons is pressed, a 
`dialog-confirmed` or `dialog-dismissed` event is emitted on the dialog's `document` to allow for easy handling with 
less boilerplate.

This field is only required if your bundle has dashboard panels.

## nodecg.graphics
An array of objects, each object describing a graphic.
Each graphic must have a `file`, `width`, and `height`. `file` is relative to the bundle's `graphics` folder.
If you wish to enforce that your graphic only ever be open in one place at a time, set `singleInstance` to `true`
(defaults to `false`).

This field is only required if your bundle has graphics.
