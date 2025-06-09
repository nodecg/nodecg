[![Published on NPM](https://img.shields.io/npm/v/@polymer/paper-item.svg)](https://www.npmjs.com/package/@polymer/paper-item)
[![Build status](https://travis-ci.org/PolymerElements/paper-item.svg?branch=master)](https://travis-ci.org/PolymerElements/paper-item)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/paper-item)

## &lt;paper-item&gt;
`<paper-item>` is an interactive list item. By default, it is a horizontal flexbox.
```html
<paper-item>Item</paper-item>
```

Use this element with `<paper-item-body>` to make Material Design styled two-line and three-line
items.

```html
<paper-item>
  <paper-item-body two-line>
    <div>Show your status</div>
    <div secondary>Your status is visible to everyone</div>
  </paper-item-body>
  <iron-icon icon="warning"></iron-icon>
</paper-item>
```

To use `paper-item` as a link, wrap it in an anchor tag. Since `paper-item` will
already receive focus, you may want to prevent the anchor tag from receiving
focus as well by setting its tabindex to -1.

```html
<a href="https://www.polymer-project.org/" tabindex="-1">
  <paper-item raised>Polymer Project</paper-item>
</a>
```

If you are concerned about performance and want to use `paper-item` in a `paper-listbox`
with many items, you can just use a native `button` with the `paper-item` class
applied (provided you have correctly included the shared styles):

```html
<style is="custom-style" include="paper-item-shared-styles"></style>

<paper-listbox>
  <button class="paper-item" role="option">Inbox</button>
  <button class="paper-item" role="option">Starred</button>
  <button class="paper-item" role="option">Sent mail</button>
</paper-listbox>
```

### Styling

The following custom properties and mixins are available for styling:

| Custom property | Description | Default |
| --- | --- | --- |
| `--paper-item-min-height` | Minimum height of the item | `48px` |
| `--paper-item` | Mixin applied to the item | `{}` |
| `--paper-item-selected-weight` | The font weight of a selected item | `bold` |
| `--paper-item-selected` | Mixin applied to selected paper-items | `{}` |
| `--paper-item-disabled-color` | The color for disabled paper-items | `--disabled-text-color` |
| `--paper-item-disabled` | Mixin applied to disabled paper-items | `{}` |
| `--paper-item-focused` | Mixin applied to focused paper-items | `{}` |
| `--paper-item-focused-before` | Mixin applied to :before focused paper-items | `{}` |

### Accessibility

This element has `role="listitem"` by default. Depending on usage, it may be more appropriate to set
`role="menuitem"`, `role="menuitemcheckbox"` or `role="menuitemradio"`.

```html
<paper-item role="menuitemcheckbox">
  <paper-item-body>
    Show your status
  </paper-item-body>
  <paper-checkbox></paper-checkbox>
</paper-item>
```



## &lt;paper-icon-item&gt;

`<paper-icon-item>` is a convenience element to make an item with icon. It is an interactive list
item with a fixed-width icon area, according to Material Design. This is useful if the icons are of
varying widths, but you want the item bodies to line up. Use this like a `<paper-item>`. The child
node with the slot `item-icon` is placed in the icon area.

```html
<paper-icon-item>
  <iron-icon icon="favorite" slot="item-icon"></iron-icon>
  Favorite
</paper-icon-item>
<paper-icon-item>
  <div class="avatar" slot="item-icon"></div>
  Avatar
</paper-icon-item>
```

### Styling

The following custom properties and mixins are available for styling:

| Custom property | Description | Default |
| --- | --- | --- |
| `--paper-item-icon-width` | Width of the icon area | `56px` |
| `--paper-item-icon` | Mixin applied to the icon area | `{}` |
| `--paper-icon-item` | Mixin applied to the item | `{}` |
| `--paper-item-selected-weight` | The font weight of a selected item | `bold` |
| `--paper-item-selected` | Mixin applied to selected paper-items | `{}` |
| `--paper-item-disabled-color` | The color for disabled paper-items | `--disabled-text-color` |
| `--paper-item-disabled` | Mixin applied to disabled paper-items | `{}` |
| `--paper-item-focused` | Mixin applied to focused paper-items | `{}` |
| `--paper-item-focused-before` | Mixin applied to :before focused paper-items | `{}` |

### Changes in 2.0

Distribution is now done with the `slot="item-icon"` attributes (replacing the `item-icon` attribute):

    <paper-icon-item>
      <iron-icon icon="favorite" slot="item-icon"></iron-icon>
      Favorite
    </paper-icon-item>

## &lt;paper-item-body&gt;

Use `<paper-item-body>` in a `<paper-item>` or `<paper-icon-item>` to make two- or
three- line items. It is a flex item that is a vertical flexbox.

```html
<paper-item>
  <paper-item-body two-line>
    <div>Show your status</div>
    <div secondary>Your status is visible to everyone</div>
  </paper-item-body>
</paper-item>
```

The child elements with the `secondary` attribute is given secondary text styling.

### Styling

The following custom properties and mixins are available for styling:

| Custom property | Description | Default |
| --- | --- | --- |
| `--paper-item-body-two-line-min-height` | Minimum height of a two-line item | `72px` |
| `--paper-item-body-three-line-min-height` | Minimum height of a three-line item | `88px` |
| `--paper-item-body-secondary-color` | Foreground color for the `secondary` area | `--secondary-text-color` |
| `--paper-item-body-secondary` | Mixin applied to the `secondary` area | `{}` |


See: [Documentation](https://www.webcomponents.org/element/@polymer/paper-item),
  [Demo](https://www.webcomponents.org/element/@polymer/paper-item/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/paper-item
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/paper-item/paper-item.js';
    </script>
  </head>
  <body>
    <paper-item>Item</paper-item>
  </body>
</html>
```
### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/paper-item/paper-item.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <paper-item>Item</paper-item>
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
git clone https://github.com/PolymerElements/paper-item
cd paper-item
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
