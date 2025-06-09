[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-validatable-behavior.svg)](https://www.npmjs.com/package/@polymer/iron-validatable-behavior)
[![Build status](https://travis-ci.org/PolymerElements/iron-validatable-behavior.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-validatable-behavior)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-validatable-behavior)

## IronValidatableBehavior
Use `IronValidatableBehavior` to implement an element that validates user input. By using this behaviour, your custom element will get a public `validate()` method, which
will return the validity of the element, and a corresponding `invalid` attribute,
which can be used for styling. Can be used alongside an element implementing
the  `IronValidatableBehavior` behaviour.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-validatable-behavior),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-validatable-behavior/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/iron-validatable-behavior
```

### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {IronValidatableBehavior} from '@polymer/iron-validatable-behavior/iron-validatable-behavior.js';

class SampleElement extends mixinBehaviors([IronValidatableBehavior], PolymerElement) {
  static get template() {
    return html`
      <style>
        :host {
          border: 1px solid green;
          color: green;
        }
        :host([invalid]) {
          border: 1px solid red;
          color: red;
        }
      </style>
      <input id="input">
    `;

    // Override this method if you want to implement custom validity
    // for your element. This element is only valid if the value in the
    // input is "cat".
    function _getValidity() {
      return this.$.input.value === 'cat';
    }
  }
}
customElements.define('sample-element', SampleElement);
```

### In an html file using the element
```html
<html>
  <head>
    <script type="module" src="./sample-element.js"></script>
  </head>
  <body>
    <sample-element id="el"></sample-element>
    <button onclick="el.validate()">Validate!</button>
  </body>
</html>
```

## Contributing
If you want to send a PR to this element, here are
the instructions for running the tests and demo locally:

### Installation
```sh
git clone https://github.com/PolymerElements/iron-validatable-behavior
cd iron-validatable-behavior
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
