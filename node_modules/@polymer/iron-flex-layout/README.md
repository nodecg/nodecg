[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-flex-layout.svg)](https://www.npmjs.com/package/@polymer/iron-flex-layout)
[![Build status](https://travis-ci.org/PolymerElements/iron-flex-layout.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-flex-layout)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-flex-layout)

## &lt;iron-flex-layout&gt;
The `<iron-flex-layout>` component provides simple ways to use
[CSS flexible box layout](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Flexible_boxes),
also known as flexbox. Note that this is an old element, that was written
before all modern browsers had non-prefixed flex styles. As such, nowadays you
don't really need to use this element anymore, and can use CSS flex styles
directly in your code.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-flex-layout),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-flex-layout/demo/demo/index.html).

This component provides two different ways to use flexbox:

1. [Layout classes](https://github.com/PolymerElements/iron-flex-layout/tree/master/iron-flex-layout-classes.html).
The layout class stylesheet provides a simple set of class-based flexbox rules, that
let you specify layout properties directly in markup. You must include this file
in every element that needs to use them.

1. [Custom CSS mixins](https://github.com/PolymerElements/iron-flex-layout/blob/master/iron-flex-layout.html).
The mixin stylesheet includes custom CSS mixins that can be applied inside a CSS rule using the `@apply` function.

## Usage

### Installation
```
npm install --save @polymer/iron-flex-layout
```

### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <style is="custom-style" include="iron-flex iron-flex-alignment"></style>
      <style>
        .test { width: 100px; }
      </style>
      <div class="layout horizontal center-center">
        <div class="test">horizontal layout center alignment</div>
      </div>
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
git clone https://github.com/PolymerElements/iron-flex-layout
cd iron-flex-layout
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
