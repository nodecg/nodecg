[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-checked-element-behavior.svg)](https://www.npmjs.com/package/@polymer/iron-checked-element-behavior)
[![Build status](https://travis-ci.org/PolymerElements/iron-checked-element-behavior.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-checked-element-behavior)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-checked-element-behavior)

## IronCheckedElementBehavior

Use `IronCheckedElementBehavior` to implement a custom element that has a
`checked` property, which can be used for validation if the element is also
`required`. Element instances implementing this behavior will also be
registered for use in an `iron-form` element.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-checked-element-behavior),
 [Demo](https://www.webcomponents.org/element/@polymer/iron-checked-element-behavior/demo/demo/index.html).

## Usage

### Installation

```
npm install --save @polymer/iron-checked-element-behavior
```

### In a Polymer 3 element

```js
import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import {IronCheckedElementBehavior} from '../iron-checked-element-behavior.js';

class SimpleCheckbox extends mixinBehaviors(IronCheckedElementBehavior, PolymerElement) {
  static get template() {
    return html`
      <style>
        :host([invalid]) {
          color: red;
        }
      </style>

      <button on-click="_checkValidity">validate</button>
      <input type="checkbox" id="checkbox" checked="{{checked::input}}">
      <span id="labelText">{{label}}</span>
    `;
  }

  static get properties() {
    return {label: {type: String, value: 'not validated'}};
  }

  _checkValidity() {
    this.validate();
    this.label = this.invalid ? 'is invalid' : 'is valid';
  }
}

customElements.define('simple-checkbox', SimpleCheckbox);
```

## Contributing

If you want to send a PR to this element, here are the instructions for running
the tests and demo locally:

### Installation

```sh
git clone https://github.com/PolymerElements/iron-checked-element-behavior
cd iron-checked-element-behavior
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
