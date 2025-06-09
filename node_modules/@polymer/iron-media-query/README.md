[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-media-query.svg)](https://www.npmjs.com/package/@polymer/iron-media-query)
[![Build status](https://travis-ci.org/PolymerElements/iron-media-query.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-media-query)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-media-query)

## &lt;iron-media-query&gt;
`iron-media-query` can be used to data bind to a CSS media query.
The `query` property is a bare CSS media query.
The `query-matches` property is a boolean representing whether the page matches that media query.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-media-query),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-media-query/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/iron-media-query
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/iron-media-query/iron-media-query.js';
    </script>
  </head>
  <body>
    <iron-media-query query="(min-width: 600px)"></iron-media-query>
  </body>
</html>
```
### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/iron-media-query/iron-media-query.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <iron-media-query query="(min-width: 600px)"></iron-media-query>
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
git clone https://github.com/PolymerElements/iron-media-query
cd iron-media-query
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
