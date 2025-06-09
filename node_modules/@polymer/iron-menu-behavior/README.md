[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-menu-behavior.svg)](https://www.npmjs.com/package/@polymer/iron-menu-behavior)
[![Build status](https://travis-ci.org/PolymerElements/iron-menu-behavior.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-menu-behavior)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-menu-behavior)

## `IronMenuBehavior`, `IronMenubarBehavior`

`IronMenuBehavior` and `IronMenubarBehavior` implement accessible menu and
menubar behaviors.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-menu-behavior),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-menu-behavior/demo/demo/index.html).

## Usage

### Installation

```
npm install --save @polymer/iron-menu-behavior
```

### In a Polymer 3 element

```js
import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import {IronMenuBehavior} from '@polymer/iron-menu-behavior/iron-menu-behavior.js';

class SimpleMenu extends mixinBehaviors(IronMenuBehavior, PolymerElement) {
  static get template() {
    return html`
      <style>
        :host > ::slotted(*) {
          display: block;
        }

        :host > ::slotted(.iron-selected) {
          color: white;
          background-color: var(--google-blue-500);
        }
      </style>

      <slot></slot>
    `;
  }
}

customElements.define('simple-menu', SimpleMenu);
```

Then, in your HTML:

```html
<script type="module" src="./simple-menu.js"></script>

<style>
simple-menu .iron-selected {
  background-color: blue;
  color: white;
}
</style>

<simple-menu>
  <div role="menuitem">Item 0</div>
  <div role="menuitem">Item 1</div>
  <div role="menuitem" disabled aria-disabled="true">Item 2 (disabled)</div>
</simple-menu>
```

## Contributing

If you want to send a PR to this element, here are the instructions for running
the tests and demo locally:

### Installation

```sh
git clone https://github.com/PolymerElements/iron-menu-behavior
cd iron-menu-behavior
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
