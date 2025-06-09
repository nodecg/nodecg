<!---
This README is automatically generated from the comments in these files:
iron-button-state.html  iron-control-state.html

Edit those files, and our readme bot will duplicate them over here!
Edit this file, and the bot will squash your changes :)

The bot does some handling of markdown. Please file a bug if it does the wrong
thing! https://github.com/PolymerLabs/tedium/issues
-->

[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-behaviors.svg)](https://www.npmjs.com/package/@polymer/iron-behaviors)
[![Build status](https://travis-ci.org/PolymerElements/iron-behaviors.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-behaviors)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-behaviors)

## &lt;iron-behaviors&gt;
`<iron-behaviors>` provides a set of behaviors for the iron elements.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-behaviors),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-behaviors/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/iron-behaviors
```

### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {IronButtonState} from '../iron-button-state.js';
import {IronControlState} from '../iron-control-state.js';

class SampleElement extends mixinBehaviors([IronButtonState, IronControlState], PolymerElement) {
  static get template() {
    return html`
      <style>
        :host {
          display: inline-block;
        }

        :host([disabled]) {
          opacity: 0.3;
          pointer-events: none;
        }

        :host([active]),
        :host([pressed]) {
          background-color: blue;
        }

        :host([focused]) {
          background-color: cornflowerblue;
        }
      </style>
      <slot></slot>
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
git clone https://github.com/PolymerElements/iron-behaviors
cd iron-behaviors
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
