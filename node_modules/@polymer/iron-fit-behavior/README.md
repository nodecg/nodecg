[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-fit-behavior.svg)](https://www.npmjs.com/package/@polymer/iron-fit-behavior)
[![Build status](https://travis-ci.org/PolymerElements/iron-fit-behavior.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-fit-behavior)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-fit-behavior)

## IronFitBehavior

`IronFitBehavior` positions and fits an element in the bounds of another
element and optionally centers it in the window or the other element.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-fit-behavior),
 [Demo](https://www.webcomponents.org/element/@polymer/iron-fit-behavior/demo/demo/index.html).

## Usage

### Installation

```
npm install --save @polymer/iron-fit-behavior
```

### In a Polymer 3 element

```js
import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import {IronFitBehavior} from '@polymer/iron-fit-behavior/iron-fit-behavior.js';

class SimpleFit extends mixinBehaviors(IronFitBehavior, PolymerElement) {
  static get template() {
    return html`
      <style>
        :host {
          background: lightblue;
          padding: 2px;
        }
      </style>
      verticalAlign: [[verticalAlign]], horizontalAlign: [[horizontalAlign]]
    `;
  }
}

customElements.define('simple-fit', SimpleFit);
```

Then, in your HTML:

```html
<script type="module" src="./simple-fit.js"></script>

<style>
#container {
  margin: 3em;
  border: 2px dashed gray;
  padding: 3em;
}
</style>

<div id="container">
  The <code>&lt;simple-fit&gt;</code> below will be positioned within this div.
  <simple-fit id="simpleFitElement"
    vertical-align="bottom"
    horizontal-align="left"
    auto-fit-on-attach
  ></simple-fit>
</div>
```

## Contributing

If you want to send a PR to this element, here are the instructions for running
the tests and demo locally:

### Installation

```sh
git clone https://github.com/PolymerElements/iron-fit-behavior
cd iron-fit-behavior
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
