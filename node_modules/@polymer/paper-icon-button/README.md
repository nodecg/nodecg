[![Published on NPM](https://img.shields.io/npm/v/@polymer/paper-icon-button.svg)](https://www.npmjs.com/package/@polymer/paper-icon-button)
[![Build status](https://travis-ci.org/PolymerElements/paper-icon-button.svg?branch=master)](https://travis-ci.org/PolymerElements/paper-icon-button)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/paper-icon-button)

## &lt;paper-icon-button&gt;
`paper-icon-button` is a button with an image placed at the center. When the user touches
the button, a ripple effect emanates from the center of the button.

`paper-icon-button` does not include a default icon set. To use icons from the default
set, include `@polymer/iron-icons/iron-icons.js`, and use the `icon` attribute to specify which icon
from the icon set to use.

See: [Documentation](https://www.webcomponents.org/element/@polymer/paper-icon-button),
  [Demo](https://www.webcomponents.org/element/@polymer/paper-icon-button/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/paper-icon-button
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/paper-icon-button/paper-icon-button.js';
      import '@polymer/iron-icons/iron-icons.js';
    </script>
  </head>
  <body>
    <paper-icon-button icon="favorite"></paper-icon-button>
  </body>
</html>
```
### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icons/iron-icons.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <paper-icon-button icon="favorite"></paper-icon-button>
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
git clone https://github.com/PolymerElements/paper-icon-button
cd paper-icon-button
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
