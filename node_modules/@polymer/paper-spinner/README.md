[![Published on NPM](https://img.shields.io/npm/v/@polymer/paper-spinner.svg)](https://www.npmjs.com/package/@polymer/paper-spinner)
[![Build status](https://travis-ci.org/PolymerElements/paper-spinner.svg?branch=master)](https://travis-ci.org/PolymerElements/paper-spinner)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/paper-spinner)

## &lt;paper-spinner&gt;
Element providing a multiple color material design circular spinner.

See: [Documentation](https://www.webcomponents.org/element/@polymer/paper-spinner),
  [Demo](https://www.webcomponents.org/element/@polymer/paper-spinner/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/paper-spinner
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/paper-spinner/paper-spinner.js';
    </script>
  </head>
  <body>
    <paper-spinner active></paper-spinner>
  </body>
</html>
```
### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/paper-spinner/paper-spinner.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <paper-spinner active></paper-spinner>
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
git clone https://github.com/PolymerElements/paper-spinner
cd paper-spinner
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
