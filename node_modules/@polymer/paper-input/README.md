[![Published on NPM](https://img.shields.io/npm/v/@polymer/paper-input.svg)](https://www.npmjs.com/package/@polymer/paper-input)
[![Build status](https://travis-ci.org/PolymerElements/paper-input.svg?branch=master)](https://travis-ci.org/PolymerElements/paper-input)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/paper-input)

## &lt;paper-input&gt;
`<paper-input>` is a single-line text field with Material Design styling.

See: [Documentation](https://www.webcomponents.org/element/@polymer/paper-input),
  [Demo](https://www.webcomponents.org/element/@polymer/paper-input/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/paper-input
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/paper-input/paper-input.js';
    </script>
  </head>
  <body>
    <paper-input always-float-label label="Floating label"></paper-input>
  </body>
</html>
```
### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/paper-input/paper-input.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <paper-input always-float-label label="Floating label"></paper-input>
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
git clone https://github.com/PolymerElements/paper-input
cd paper-input
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
