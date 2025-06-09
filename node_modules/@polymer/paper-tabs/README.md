[![Published on NPM](https://img.shields.io/npm/v/@polymer/paper-tabs.svg)](https://www.npmjs.com/package/@polymer/paper-tabs)
[![Build status](https://travis-ci.org/PolymerElements/paper-tabs.svg?branch=master)](https://travis-ci.org/PolymerElements/paper-tabs)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/paper-tabs)

## &lt;paper-tabs&gt;

`<paper-tabs>` makes it easy to explore and switch between different views or
functional aspects of an app, or to browse categorized data sets.

See: [Documentation](https://www.webcomponents.org/element/@polymer/paper-tabs),
  [Demo](https://www.webcomponents.org/element/@polymer/paper-tabs/demo/demo/index.html).

## Usage

### Installation

```
npm install --save @polymer/paper-tabs
```

### In an HTML file

```html
<html>
  <head>
    <script type="module">
      import '@polymer/paper-tabs/paper-tabs.js';
      import '@polymer/paper-tabs/paper-tab.js';
    </script>
  </head>
  <body>
    <paper-tabs selected="0" scrollable>
      <paper-tab>Tab 0</paper-tab>
      <paper-tab>Tab 1</paper-tab>
      <paper-tab>Tab 2</paper-tab>
      <paper-tab>Tab 3</paper-tab>
    </paper-tabs>
  </body>
</html>
```

### In a Polymer 3 element

```js
import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-tabs/paper-tab.js';

class ExampleElement extends PolymerElement {
  static get template() {
    return html`
      <paper-tabs selected="0" scrollable>
        <paper-tab>Tab 0</paper-tab>
        <paper-tab>Tab 1</paper-tab>
        <paper-tab>Tab 2</paper-tab>
        <paper-tab>Tab 3</paper-tab>
      </paper-tabs>
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
git clone https://github.com/PolymerElements/paper-tabs
cd paper-tabs
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
