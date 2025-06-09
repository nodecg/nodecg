[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-image.svg)](https://www.npmjs.com/package/@polymer/iron-image)
[![Build status](https://travis-ci.org/PolymerElements/iron-image.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-image)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-image)

## &lt;iron-image&gt;

`iron-image` is an element for displaying an image that provides useful sizing
and preloading options not found on the standard `<img>` tag.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-image),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-image/demo/demo/index.html).

## Usage

### Installation

```
npm install --save @polymer/iron-image
```

### In an HTML file

```html
<html>
  <head>
    <script type="module">
      import '@polymer/iron-image/iron-image.js';
    </script>
    <style>
      iron-image {
        width: 400px;
        height: 400px;
        background-color: lightgray;
      }
    </style>
  </head>
  <body>
    <iron-image sizing="cover" preload src="http://lorempixel.com/600/400"></iron-image>
  </body>
</html>
```

### In a Polymer 3 element

```js
import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import '@polymer/iron-image/iron-image.js';

class ExampleElement extends PolymerElement {
  static get template() {
    return html`
      <iron-image sizing="contain" fade src="http://lorempixel.com/600/400"></iron-image>
    `;
  }
}

customElements.define('example-element', ExampleElement);
```

## Contributing

If you want to send a PR to this element, here are the instructions for running
the tests and demo locally:

### Installation

```sh
git clone https://github.com/PolymerElements/iron-image
cd iron-image
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
