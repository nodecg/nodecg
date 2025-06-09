[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-resizable-behavior.svg)](https://www.npmjs.com/package/@polymer/iron-resizable-behavior)
[![Build status](https://travis-ci.org/PolymerElements/iron-resizable-behavior.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-resizable-behavior)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-resizable-behavior)

## IronResizableBehavior

`IronResizableBehavior` is a behavior that can be used in Polymer elements to
coordinate the flow of resize events between "resizers" (elements that control the
size or hidden state of their children) and "resizables" (elements that need to be
notified when they are resized or un-hidden by their parents in order to take
action on their new measurements).

Elements that perform measurement should add the `IronResizableBehavior` behavior to
their element definition and listen for the `iron-resize` event on themselves.
This event will be fired when they become showing after having been hidden,
when they are resized explicitly by another resizable, or when the window has been
resized.

Note, the `iron-resize` event is non-bubbling.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-resizable-behavior),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-resizable-behavior/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/iron-resizable-behavior
```

### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {IronResizableBehavior} from '@polymer/iron-resizable-behavior/iron-resizable-behavior.js';

class SampleElement extends mixinBehaviors([IronResizableBehavior], PolymerElement) {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
        }
      </style>
      <span>width: [[width]] </span>
      <span>height: [[height]]</span>
    `;
  }

  static get properties() {
    return {
      width: Number,
      height: Number,
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('iron-resize', this.onIronResize.bind(this));
  }

  onIronResize() {
    this.width = this.offsetWidth;
    this.height = this.offsetHeight;
  }
}
customElements.define('sample-element', SampleElement);
```

## Contributing
If you want to send a PR to this element, here are
the instructions for running the tests and demo locally:

### Installation
```sh
git clone https://github.com/PolymerElements/iron-resizable-behavior
cd iron-resizable-behavior
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