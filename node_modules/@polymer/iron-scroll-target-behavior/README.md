[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-scroll-target-behavior.svg)](https://www.npmjs.com/package/@polymer/iron-scroll-target-behavior)
[![Build status](https://travis-ci.org/PolymerElements/iron-scroll-target-behavior.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-scroll-target-behavior)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-scroll-target-behavior)

## IronScrollTargetBehavior

`IronScrollTargetBehavior` allows an element to respond to scroll events from a
designated scroll target.

Elements that consume this behavior can override the `_scrollHandler`
method to add logic on the scroll event.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-scroll-target-behavior),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-scroll-target-behavior/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/iron-scroll-target-behavior
```

### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {IronScrollTargetBehavior} from '@polymer/iron-scroll-target-behavior/iron-scroll-target-behavior.js';

class SampleElement extends mixinBehaviors(IronScrollTargetBehavior, PolymerElement) {
  static get template() {
    return html`
      <p>Scrollable content here</p>
    `;
  }

  _scrollHandler() {
    console.log('_scrollHandler', this._scrollTop, this._scrollLeft);
  }
}
customElements.define('sample-element', SampleElement);
```

## Contributing
If you want to send a PR to this element, here are
the instructions for running the tests and demo locally:

### Installation
```sh
git clone https://github.com/PolymerElements/iron-scroll-target-behavior
cd iron-scroll-target-behavior
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
