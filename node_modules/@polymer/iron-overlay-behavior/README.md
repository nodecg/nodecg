[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-overlay-behavior.svg)](https://www.npmjs.com/package/@polymer/iron-overlay-behavior)
[![Build status](https://travis-ci.org/PolymerElements/iron-overlay-behavior.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-overlay-behavior)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-overlay-behavior)

## IronOverlayBehavior

Use `IronOverlayBehavior` to implement an element that can be hidden or shown, and displays
on top of other content. It includes an optional backdrop, and can be used to implement a variety
of UI controls including dialogs and drop downs. Multiple overlays may be displayed at once.

See the [demo source code](https://github.com/PolymerElements/iron-overlay-behavior/blob/master/demo/simple-overlay.js)
for an example.

### Closing and canceling

An overlay may be hidden by closing or canceling. The difference between close and cancel is user
intent. Closing generally implies that the user acknowledged the content on the overlay. By default,
it will cancel whenever the user taps outside it or presses the escape key. This behavior is
configurable with the `no-cancel-on-esc-key` and the `no-cancel-on-outside-click` properties.
`close()` should be called explicitly by the implementer when the user interacts with a control
in the overlay element. When the dialog is canceled, the overlay fires an 'iron-overlay-canceled'
event. Call `preventDefault` on this event to prevent the overlay from closing.

### Positioning

By default the element is sized and positioned to fit and centered inside the window. You can
position and size it manually using CSS. See `Polymer.IronFitBehavior`.

### Backdrop

Set the `with-backdrop` attribute to display a backdrop behind the overlay. The backdrop is
appended to `<body>` and is of type `<iron-overlay-backdrop>`. See its doc page for styling
options.

In addition, `with-backdrop` will wrap the focus within the content in the light DOM.
Override the [`_focusableNodes` getter](#Polymer.IronOverlayBehavior:property-_focusableNodes)
to achieve a different behavior.

### Limitations

The element is styled to appear on top of other content by setting its `z-index` property. You
must ensure no element has a stacking context with a higher `z-index` than its parent stacking
context. You should place this element as a child of `<body>` whenever possible.

## &lt;iron-overlay-backdrop&gt;

`iron-overlay-backdrop` is a backdrop used by `Polymer.IronOverlayBehavior`. It should be a
singleton.

### Styling

The following custom properties and mixins are available for styling.

| Custom property | Description | Default |
| --- | --- | --- |
| `--iron-overlay-backdrop-background-color` | Backdrop background color | #000 |
| `--iron-overlay-backdrop-opacity` | Backdrop opacity | 0.6 |
| `--iron-overlay-backdrop` | Mixin applied to `iron-overlay-backdrop`. | {} |
| `--iron-overlay-backdrop-opened` | Mixin applied to `iron-overlay-backdrop` when it is displayed | {} |

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-overlay-behavior),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-overlay-behavior/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/iron-overlay-behavior
```

### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {IronOverlayBehavior} from '@polymer/iron-overlay-behavior/iron-overlay-behavior.js';

class SampleElement extends mixinBehaviors(IronOverlayBehavior, PolymerElement) {
  static get template() {
    return html`
      <style>
        :host {
          background: white;
        }
      </style>
      <p>Overlay Content</p>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

## Contributing
If you want to send a PR to this element, here are
the instructions for running the tests and demo locally:

### Installation
```sh
git clone https://github.com/PolymerElements/iron-overlay-behavior
cd iron-overlay-behavior
npm install
npm install -g polymer-cli
```

### Running the demo locally
```sh
polymer serve --npm
open http://127.0.0.1:<port>/demo/
```

### Running the tests
```sh
polymer test --npm
```
