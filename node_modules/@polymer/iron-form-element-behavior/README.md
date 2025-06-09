[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-form-element-behavior.svg)](https://www.npmjs.com/package/@polymer/iron-form-element-behavior)
[![Build status](https://travis-ci.org/PolymerElements/iron-form-element-behavior.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-form-element-behavior)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-form-element-behavior)

## IronFormElementBehavior
`IronFormElementBehavior` adds a `name`, `value` and `required` properties to
a custom element. This element is deprecated, and only exists for back compatibility
with Polymer 1.x (where `iron-form` was a type extension), and
it is not something you want to use. No contributions or fixes will be accepted.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-form-element-behavior).

## Usage

### Installation
```
npm install --save @polymer/iron-form-element-behavior
```

### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {IronFormElementBehavior} from '@polymer/iron-form-element-behavior/iron-form-element-behavior.js';

class SampleElement extends mixinBehaviors([IronFormElementBehavior], PolymerElement) {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <input name="[[name]]" value="{{value}}">
    `;
  }
}
customElements.define('sample-element', SampleElement);
```
