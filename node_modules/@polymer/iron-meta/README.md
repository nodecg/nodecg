[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-meta.svg)](https://www.npmjs.com/package/@polymer/iron-meta)
[![Build status](https://travis-ci.org/PolymerElements/iron-meta.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-meta)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-meta)

## &lt;iron-meta&gt;

`iron-meta` is a generic element you can use for sharing information across the
DOM tree.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-meta),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-meta/demo/demo/index.html).

## Usage

### Installation

```
npm install --save @polymer/iron-meta
```

### In an HTML file

```html
<html>
  <head>
    <script type="module">
      import '@polymer/iron-meta/iron-meta.js';
    </script>
  </head>
  <body>
    <iron-meta key="info" value="foo"></iron-meta>
    <!-- Other elements reading from the key 'info' see the value 'foo'. -->
  </body>
</html>
```

### In a Polymer 3 element

```js
import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import '@polymer/iron-meta/iron-meta.js';

class ExampleElement extends PolymerElement {
  static get properties() {
    return {
      prop: String,
    };
  }

  static get template() {
    return html`
      <iron-meta key="info" value="{{prop}}"></iron-meta>
      info: [[prop]]
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
git clone https://github.com/PolymerElements/iron-meta
cd iron-meta
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
