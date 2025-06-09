[![Published on NPM](https://img.shields.io/npm/v/@polymer/paper-toolbar.svg)](https://www.npmjs.com/package/@polymer/paper-toolbar)
[![Build status](https://travis-ci.org/PolymerElements/paper-toolbar.svg?branch=master)](https://travis-ci.org/PolymerElements/paper-toolbar)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/paper-toolbar)

## &lt;paper-toolbar&gt;

**This element has been deprecated in favor of [app-layout](https://github.com/PolymerElements/app-layout).**

`paper-toolbar` is a horizontal bar containing items that can be used for
label, navigation, search and actions.  The items placed inside the
`paper-toolbar` are projected into a `class="horizontal center layout"` container inside of
`paper-toolbar`'s Shadow DOM.  You can use flex attributes to control the items'
sizing.

Example:

```html
<paper-toolbar>
  <paper-icon-button slot="top" icon="menu" on-tap="menuAction"></paper-icon-button>
  <div slot="top" class="title">Title</div>
  <paper-icon-button slot="top" icon="more-vert" on-tap="moreAction"></paper-icon-button>
</paper-toolbar>
```

`paper-toolbar` has a standard height, but can made be taller by setting `tall`
class on the `paper-toolbar`. This will make the toolbar 3x the normal height.

```html
<paper-toolbar class="tall">
  <paper-icon-button slot="top" icon="menu"></paper-icon-button>
</paper-toolbar>
```

Apply `medium-tall` class to make the toolbar medium tall.  This will make the
toolbar 2x the normal height.

```html
<paper-toolbar class="medium-tall">
  <paper-icon-button slot="top" icon="menu"></paper-icon-button>
</paper-toolbar>
```

When `tall`, items can pin to either the top (default), middle or bottom. Use
`middle` slot for middle content and `bottom` slot for bottom content.

```html
<paper-toolbar class="tall">
  <paper-icon-button slot="top" icon="menu"></paper-icon-button>
  <div slot="middle" class="title">Middle Title</div>
  <div slot="bottom" class="title">Bottom Title</div>
</paper-toolbar>
```

For `medium-tall` toolbar, the middle and bottom contents overlap and are
pinned to the bottom. But `middleJustify` and `bottomJustify` attributes are
still honored separately.

To make an element completely fit at the bottom of the toolbar, use `fit` along
with `bottom`.

```html
<paper-toolbar class="tall">
  <div id="progressBar" slot="bottom" class="fit"></div>
</paper-toolbar>
```

When inside a `paper-header-panel` element with `mode="waterfall-tall"`, 
the class `.animate` is toggled to animate the height change in the toolbar. 

### Styling

The following custom properties and mixins are available for styling:

Custom property | Description | Default
----------------|-------------|----------
`--paper-toolbar-title`      | Mixin applied to the title of the toolbar | `{}`
`--paper-toolbar-background` | Toolbar background color     | `--primary-color`
`--paper-toolbar-color`      | Toolbar foreground color     | `--dark-theme-text-color`
`--paper-toolbar-height`     | Custom height for toolbar    | `64px`
`--paper-toolbar-sm-height`  | Custom height for small screen toolbar | `56px`
`--paper-toolbar`            | Mixin applied to the toolbar | `{}`
`--paper-toolbar-content`    | Mixin applied to the content section of the toolbar | `{}`
`--paper-toolbar-medium`     | Mixin applied to medium height toolbar | `{}`
`--paper-toolbar-tall`       | Mixin applied to tall height toolbar | `{}`
`--paper-toolbar-transition` | Transition applied to the `.animate` class | `height 0.18s ease-in`

### Accessibility

`<paper-toolbar>` has `role="toolbar"` by default. Any elements with the class `title` will
be used as the label of the toolbar via `aria-labelledby`.

See: [Documentation](https://www.webcomponents.org/element/@polymer/paper-toolbar),
  [Demo](https://www.webcomponents.org/element/@polymer/paper-toolbar/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/paper-toolbar
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/paper-toolbar/paper-toolbar.js';
    </script>
  </head>
  <body>
    <paper-toolbar>
      <div slot="top" class="title">Title</div>
    </paper-toolbar>
  </body>
</html>
```
### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/paper-toolbar/paper-toolbar.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <paper-toolbar>
        <div slot="top" class="title">Title</div>
      </paper-toolbar>
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
git clone https://github.com/PolymerElements/paper-toolbar
cd paper-toolbar
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
