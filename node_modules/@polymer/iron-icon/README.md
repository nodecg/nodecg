[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-icon.svg)](https://www.npmjs.com/package/@polymer/iron-icon)
[![Build status](https://travis-ci.org/PolymerElements/iron-icon.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-icon)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-icon)

## &lt;iron-icon&gt;

The `iron-icon` element displays an icon. By default an icon renders as a 24px
square.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-icon),
 [Demo](https://www.webcomponents.org/element/@polymer/iron-icon/demo/demo/index.html).

## Usage

### Installation

```
npm install --save @polymer/iron-icon
```

### In an HTML file

```html
<html>
  <head>
    <script type="module">
      import '@polymer/iron-icon/iron-icon.js';
    </script>
  </head>
  <body>
    <iron-icon src="demo/location.png"></iron-icon>

    <!-- You can use an icon from an imported iconset. -->
    <script type="module">
      import '@polymer/iron-icons/iron-icons.js';
    </script>
    <iron-icon icon="search"></iron-icon>
  </body>
</html>
```

### In a Polymer 3 element

```js
import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import '@polymer/iron-icon/iron-icon.js';

class ExampleElement extends PolymerElement {
  static get template() {
    return html`
      <iron-icon src="demo/location.png"></iron-icon>
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
git clone https://github.com/PolymerElements/iron-icon
cd iron-icon
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
