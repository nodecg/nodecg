[![Published on NPM](https://img.shields.io/npm/v/@polymer/paper-dialog.svg)](https://www.npmjs.com/package/@polymer/paper-dialog)
[![Build status](https://travis-ci.org/PolymerElements/paper-dialog.svg?branch=master)](https://travis-ci.org/PolymerElements/paper-dialog)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/paper-dialog)

## &lt;paper-dialog&gt;
`<paper-dialog>` is a dialog with Material Design styling and optional animations when it is
opened or closed. It provides styles for a header, content area, and an action area for buttons.
You can use the `<paper-dialog-scrollable>` element (in its own repository) if you need a scrolling
content area. To autofocus a specific child element after opening the dialog, give it the `autofocus`
attribute. See `PaperDialogBehavior` and `IronOverlayBehavior` for specifics.

For example, the following code implements a dialog with a header, scrolling content area and
buttons. Focus will be given to the `dialog-confirm` button when the dialog is opened.

```html
<paper-dialog>
  <h2>Header</h2>
  <paper-dialog-scrollable>
    Lorem ipsum...
  </paper-dialog-scrollable>
  <div class="buttons">
    <paper-button dialog-dismiss>Cancel</paper-button>
    <paper-button dialog-confirm autofocus>Accept</paper-button>
  </div>
</paper-dialog>
```

### Styling

See the docs for `PaperDialogBehavior` for the custom properties available for styling
this element.

### Animations

Set the `entry-animation` and/or `exit-animation` attributes to add an animation when the dialog
is opened or closed. See the documentation in
[PolymerElements/neon-animation](https://github.com/PolymerElements/neon-animation) for more info.

For example:

```html
<script type="module">
  import '@polymer/neon-animation/animations/scale-up-animation.js';
  import '@polymer/neon-animation/animations/fade-out-animation.js';
</script>

<paper-dialog entry-animation="scale-up-animation"
              exit-animation="fade-out-animation">
  <h2>Header</h2>
  <div>Dialog body</div>
</paper-dialog>
```

### Accessibility

See the docs for `PaperDialogBehavior` for accessibility features implemented by this
element.

See: [Documentation](https://www.webcomponents.org/element/@polymer/paper-dialog),
  [Demo](https://www.webcomponents.org/element/@polymer/paper-dialog/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/paper-dialog
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/paper-dialog/paper-dialog.js';
    </script>
  </head>
  <body>
    <paper-dialog>
      <h2>Content</h2>
    </paper-dialog>
  </body>
</html>
```
### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/paper-dialog/paper-dialog.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <paper-dialog>
        <h2>Content</h2>
      </paper-dialog>
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
git clone https://github.com/PolymerElements/paper-dialog
cd paper-dialog
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
