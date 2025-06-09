[![Published on NPM](https://img.shields.io/npm/v/@polymer/paper-behaviors.svg)](https://www.npmjs.com/package/@polymer/paper-behaviors)
[![Build status](https://travis-ci.org/PolymerElements/paper-behaviors.svg?branch=master)](https://travis-ci.org/PolymerElements/paper-behaviors)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/paper-behaviors)

## &lt;paper-behaviors&gt;
`<paper-behaviors>` is a set of behaviours to help implement Material Design elements:

- `PaperCheckedElementBehavior` to implement a custom element
that has a `checked` property similar to `IronCheckedElementBehavior`
and is compatible with having a ripple effect.
- `PaperInkyFocusBehavior` implements a ripple when the element has keyboard focus.
- `PaperRippleBehavior` dynamically implements a ripple
when the element has focus via pointer or keyboard. This behavior is intended to be used in conjunction with and after
`IronButtonState` and `IronControlState`.

See: [Documentation](https://www.webcomponents.org/element/@polymer/paper-behaviors),
  [Demo](https://www.webcomponents.org/element/@polymer/paper-behaviors/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/paper-behaviors
```

### Example of using one of the behaviours in a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {PaperButtonBehavior} from '@polymer/paper-behaviors/paper-button-behavior.js';

class SampleElement extends mixinBehaviors([PaperButtonBehavior], PolymerElement) {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
        /* Some properties inherited from the behaviour */
        :host([disabled]) {
          background-color: grey;
          pointer-events: none;
        }
        :host([active]),
        :host([pressed]) {
          background-color: blue;
        }
      </style>
      <div>I am a ripple-y button</div>
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
git clone https://github.com/PolymerElements/paper-behaviors
cd paper-behaviors
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
