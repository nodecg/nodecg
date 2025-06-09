[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-selector.svg)](https://www.npmjs.com/package/@polymer/iron-selector)
[![Build status](https://travis-ci.org/PolymerElements/iron-selector.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-selector)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-selector)

## &lt;iron-selector&gt;, `IronSelectableBehavior`, `IronMultiSelectableBehavior`

`iron-selector` is an element which can be used to manage a list of elements
that can be selected. Tapping on the item will make the item selected. The
`selected` indicates which item is being selected. The default is to use the
index of the item. `iron-selector`'s functionality is entirely defined by
`IronMultiSelectableBehavior`.

`IronSelectableBehavior` gives an element the concept of a selected child
element. By default, the element will select one of its selectable children
when a ['tap'
event](https://www.polymer-project.org/3.0/docs/devguide/gesture-events#gesture-event-types)
(synthesized by Polymer, roughly 'click') is dispatched to it.

`IronSelectableBehavior` lets you ...

  - decide which children should be considered selectable (`selectable`),
  - retrieve the currently selected element (`selectedItem`) and all elements
    in the selectable set (`items`),
  - change the selection (`select`, `selectNext`, etc.),
  - decide how selected elements are modified to indicate their selected state
    (`selectedClass`, `selectedAttribute`),

... among other things.

`IronMultiSelectableBehavior` includes all the features of
`IronSelectableBehavior` as well as a `multi` property, which can be set to
`true` to indicate that the element can have multiple selected child elements.
It also includes the `selectedItems` and `selectedValues` properties for
working with arrays of selectable elements and their corresponding values
(`multi` is `true`) - similar to the single-item versions provided by
`IronSelectableBehavior`: `selectedItem` and `selected`.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-selector),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-selector/demo/demo/index.html).

## Usage

### Installation

```
npm install --save @polymer/iron-selector
```

### In an HTML file

```html
<html>
  <head>
    <script type="module">
      import '@polymer/iron-selector/iron-selector.js';
    </script>
  </head>
  <body>
    <iron-selector selected="0">
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
    </iron-selector>
  </body>
</html>
```

### In a Polymer 3 element

```js
import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import '@polymer/iron-selector/iron-selector.js';

class ExampleElement extends PolymerElement {
  static get template() {
    return html`
      <iron-selector selected="0">
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </iron-selector>
    `;
  }
}

customElements.define('example-element', ExampleElement);
```

## Contributing

If you want to send a PR to this element, here are the instructions for running
the tests and demo locally:

### Installation

```sh
git clone https://github.com/PolymerElements/iron-selector
cd iron-selector
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
