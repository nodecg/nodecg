[![Published on NPM](https://img.shields.io/npm/v/@polymer/paper-button.svg)](https://www.npmjs.com/package/@polymer/paper-button)
[![Build status](https://travis-ci.org/PolymerElements/paper-button.svg?branch=master)](https://travis-ci.org/PolymerElements/paper-button)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/paper-button)

## &lt;paper-button&gt;

Material design: [Buttons](https://www.google.com/design/spec/components/buttons.html)

`paper-button` is a button. When the user touches the button, a ripple effect emanates from the point of contact. It may be flat or raised. A raised button is styled with a shadow.

See: [Documentation](https://www.webcomponents.org/element/@polymer/paper-button),
  [Demo](https://www.webcomponents.org/element/@polymer/paper-button/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/paper-button
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/paper-button/paper-button.js';
    </script>
  </head>
  <body>
    <paper-button class="pink">link</paper-button>
    <paper-button raised class="indigo">raised</paper-button>
    <paper-button toggles raised class="green">toggles</paper-button>
    <paper-button disabled class="disabled">disabled</paper-button>
  </body>
</html>
```
### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/paper-button/paper-button.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <paper-button class="pink">link</paper-button>
      <paper-button raised class="indigo">raised</paper-button>
      <paper-button toggles raised class="green">toggles</paper-button>
      <paper-button disabled class="disabled">disabled</paper-button>
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
git clone https://github.com/PolymerElements/paper-button
cd paper-button
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