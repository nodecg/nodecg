[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-pages.svg)](https://www.npmjs.com/package/@polymer/iron-pages)
[![Build status](https://travis-ci.org/PolymerElements/iron-pages.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-pages)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-pages)

## &lt;iron-pages&gt;

`iron-pages` is used to select one of its children to show. One use is to cycle
through a list of children "pages".

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-pages),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-pages/demo/demo/index.html).

## Usage

### Installation

```
npm install --save @polymer/iron-pages
```

### In an HTML file

```html
<html>
  <head>
    <script type="module">
      import '@polymer/iron-pages/iron-pages.js';
    </script>
  </head>
  <body>
    <iron-pages selected="0">
      <div>Page 0</div>
      <div>Page 1</div>
      <div>Page 2</div>
      <div>Page 3</div>
    </iron-pages>
  </body>
</html>
```

### In a Polymer 3 element

```js
import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import '@polymer/iron-pages/iron-pages.js';

class ExampleElement extends PolymerElement {
  static get template() {
    return html`
      <iron-pages selected="0">
        <div>Page 0</div>
        <div>Page 1</div>
        <div>Page 2</div>
        <div>Page 3</div>
      </iron-pages>
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
git clone https://github.com/PolymerElements/iron-pages
cd iron-pages
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
