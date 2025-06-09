[![Published on NPM](https://img.shields.io/npm/v/@polymer/paper-dialog-scrollable.svg)](https://www.npmjs.com/package/@polymer/paper-dialog-scrollable)
[![Build status](https://travis-ci.org/PolymerElements/paper-dialog-scrollable.svg?branch=master)](https://travis-ci.org/PolymerElements/paper-dialog-scrollable)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/paper-dialog-scrollable)

## &lt;paper-dialog-scrollable&gt;
`paper-dialog-scrollable` implements a scrolling area used in a Material Design dialog. It shows
a divider at the top and/or bottom indicating more content, depending on scroll position. Use this
together with elements implementing `PaperDialogBehavior`.

```html
<paper-dialog>
  <h2>Header</h2>
  <paper-dialog-scrollable>
    Lorem ipsum...
  </paper-dialog-scrollable>
  <div class="buttons">
    <paper-button>OK</paper-button>
  </div>
</paper-dialog>
```

It shows a top divider after scrolling if it is not the first child in its parent container,
indicating there is more content above. It shows a bottom divider if it is scrollable and it is not
the last child in its parent container, indicating there is more content below. The bottom divider
is hidden if it is scrolled to the bottom.

If `paper-dialog-scrollable` is not a direct child of the element implementing `PaperDialogBehavior`,
remember to set the `dialogElement`:

```html
<paper-dialog id="myDialog">
  <h2>Header</h2>
  <div class="my-content-wrapper">
    <h4>Sub-header</h4>
    <paper-dialog-scrollable>
      Lorem ipsum...
    </paper-dialog-scrollable>
  </div>
  <div class="buttons">
    <paper-button>OK</paper-button>
  </div>
</paper-dialog>

<script>
  var scrollable = myDialog.querySelector('paper-dialog-scrollable');
  scrollable.dialogElement = myDialog;
</script>
```

### Styling

The following custom properties and mixins are available for styling:

| Custom property | Description | Default |
| --- | --- | --- |
| `--paper-dialog-scrollable` | Mixin for the scrollable content | {} |

See: [Documentation](https://www.webcomponents.org/element/@polymer/paper-dialog-scrollable),
  [Demo](https://www.webcomponents.org/element/@polymer/paper-dialog-scrollable/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/paper-dialog-scrollable
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/paper-dialog/paper-dialog.js';
      import '@polymer/paper-dialog-scrollable/paper-dialog-scrollable.js';
    </script>
  </head>
  <body>
    <button onclick="dialog.open()">Open</button>
    <paper-dialog id="dialog">
      <h2>Heading</h2>
      <paper-dialog-scrollable>
        <p>Scrolalble content...</p>
      </paper-dialog-scrollable>
    </paper-dialog>
  </body>
</html>
```
### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-dialog-scrollable/paper-dialog-scrollable.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <button on-click="_openDialog">Open</button>
      <paper-dialog id="dialog">
        <h2>Heading</h2>
        <paper-dialog-scrollable>
          <p>Scrolalble content...</p>
        </paper-dialog-scrollable>
      </paper-dialog>
    `;
  }

  _openDialog() {
    this.$.dialog.open();
  }
}
customElements.define('sample-element', SampleElement);
```

## Contributing
If you want to send a PR to this element, here are
the instructions for running the tests and demo locally:

### Installation
```sh
git clone https://github.com/PolymerElements/paper-dialog-scrollable
cd paper-dialog-scrollable
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
