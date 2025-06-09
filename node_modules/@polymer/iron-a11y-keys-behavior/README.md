[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-a11y-keys-behavior.svg)](https://www.npmjs.com/package/@polymer/iron-a11y-keys-behavior)
[![Build status](https://travis-ci.org/PolymerElements/iron-a11y-keys-behavior.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-a11y-keys-behavior)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-a11y-keys-behavior)

## &lt;iron-a11y-keys-behavior&gt;
`Polymer.IronA11yKeysBehavior` provides a normalized interface for processing
keyboard commands that pertain to [WAI-ARIA best practices](http://www.w3.org/TR/wai-aria-practices/#kbd_general_binding).
The element takes care of browser differences with respect to Keyboard events
and uses an expressive syntax to filter key presses.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-a11y-keys-behavior),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-a11y-keys-behavior/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/iron-a11y-keys-behavior
```

### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {IronA11yKeysBehavior} from '@polymer/iron-a11y-keys-behavior/iron-a11y-keys-behavior.js';

class SampleElement extends  extends mixinBehaviors([IronA11yKeysBehavior], PolymerElement) {
  static get template() {
    return html`
      <pre>[[pressed]]</pre>
    `;
  }

  static get properties() {
    return {
      pressed: {type: String, readOnly: true, value: ''},
      keyBindings: {
        'space': '_onKeydown', // same as 'space:keydown'
        'shift+tab': '_onKeydown',
        'enter:keypress': '_onKeypress',
        'esc:keyup': '_onKeyup'
      }
    }
  }

  function _onKeydown: function(event) {
    console.log(event.detail.combo); // KEY+MODIFIER, e.g. "shift+tab"
    console.log(event.detail.key); // KEY only, e.g. "tab"
    console.log(event.detail.event); // EVENT, e.g. "keydown"
    console.log(event.detail.keyboardEvent); // the original KeyboardEvent
  }
}
customElements.define('sample-element', SampleElement);
```

## Contributing
If you want to send a PR to this element, here are
the instructions for running the tests and demo locally:

### Installation
```sh
git clone https://github.com/PolymerElements/iron-a11y-keys-behavior
cd iron-a11y-keys-behavior
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
