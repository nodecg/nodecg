[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-range-behavior.svg)](https://www.npmjs.com/package/@polymer/iron-range-behavior)
[![Build status](https://travis-ci.org/PolymerElements/iron-range-behavior.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-range-behavior)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-range-behavior)

## `IronRangeBehavior`

`IronRangeBehavior` provides the behavior for something with a minimum to
maximum range.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-range-behavior),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-range-behavior/demo/demo/index.html).

## Usage

### Installation

```
npm install --save @polymer/iron-range-behavior
```

### In a Polymer 3 element

```js
import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import {IronRangeBehavior} from '@polymer/iron-range-behavior/iron-range-behavior.js';

class SimpleRange extends mixinBehaviors(IronRangeBehavior, PolymerElement) {
  static get template() {
    return html`
      <style>
        :host {
          display: inline-flex;
          align-items: center;
        }

        :host > * {
          margin: 0.125em;
        }

        #barContainer {
          display: inline-block;
          position: relative;
          border: 0.125em solid gray;
          height: 1em;
          width: 12em;
        }

        #bar {
          position: absolute;
          top: 0.125em;
          bottom: 0.125em;
          left: 0.125em;
          background-color: blue;
        }
      </style>

      <span>[[ratio]]%</span>
      <div id="barContainer"><div id="bar" style="width: {{ratio}}%;"></div></div>
    `;
  }
}

customElements.define('simple-range', SimpleRange);
```

Then, in your HTML:

```html
<simple-range min="0" max="200" value="120"></simple-range>
```

## Contributing

If you want to send a PR to this element, here are the instructions for running
the tests and demo locally:

### Installation

```sh
git clone https://github.com/PolymerElements/iron-range-behavior
cd iron-range-behavior
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
