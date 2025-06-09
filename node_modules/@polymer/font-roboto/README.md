[![Published on NPM](https://img.shields.io/npm/v/@polymer/font-roboto.svg)](https://www.npmjs.com/package/@polymer/paper-input)
[![Build status](https://travis-ci.org/PolymerElements/font-roboto.svg?branch=master)](https://travis-ci.org/PolymerElements/paper-input)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/font-roboto)

## font-roboto
`font-roboto` loads the Roboto family of fonts from Google Fonts.

See: [Documentation](https://www.webcomponents.org/element/@polymer/font-roboto).

## Usage

### Installation
```
npm install --save @polymer/font-roboto
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/font-roboto/roboto.js';
    </script>
  </head>
  <style>
    body {
      font-family: Roboto;
    }
  </style>
  <body>
    <p>This text is in Roboto.</p>
  </body>
</html>
```

### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/font-roboto/roboto.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <style>
        p {
          font-family: Roboto;
        }
      </style>
      <p>This text is in Roboto.</p>
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
git clone https://github.com/PolymerElements/font-roboto
cd font-roboto
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
