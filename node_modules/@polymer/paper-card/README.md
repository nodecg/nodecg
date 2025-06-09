[![Published on NPM](https://img.shields.io/npm/v/@polymer/paper-card.svg)](https://www.npmjs.com/package/@polymer/paper-card)
[![Build status](https://travis-ci.org/PolymerElements/paper-card.svg?branch=master)](https://travis-ci.org/PolymerElements/paper-card)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/paper-card)

## &lt;paper-card&gt;
`paper-card` is a container with a drop shadow.

See: [Documentation](https://www.webcomponents.org/element/@polymer/paper-card),
  [Demo](https://www.webcomponents.org/element/@polymer/paper-card/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/paper-card
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/paper-card/paper-card.js';
      import '@polymer/paper-button/paper-button.js';
    </script>
  </head>
  <body>
    <paper-card heading="Emmental" image="http://placehold.it/350x150/FFC107/000000" alt="Emmental">
      <div class="card-content">
        Emmentaler or Emmental is a yellow, medium-hard cheese that originated in the area around Emmental, Switzerland. It is one of the cheeses of Switzerland, and is sometimes known as Swiss cheese.
      </div>
      <div class="card-actions">
        <paper-button>Share</paper-button>
        <paper-button>Explore!</paper-button>
      </div>
    </paper-card>
  </body>
</html>
```
### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <paper-card heading="Emmental" image="http://placehold.it/350x150/FFC107/000000" alt="Emmental">
      <div class="card-content">
        Emmentaler or Emmental is a yellow, medium-hard cheese that originated in the area around Emmental, Switzerland. It is one of the cheeses of Switzerland, and is sometimes known as Swiss cheese.
      </div>
      <div class="card-actions">
        <paper-button>Share</paper-button>
        <paper-button>Explore!</paper-button>
      </div>
    </paper-card>
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
git clone https://github.com/PolymerElements/paper-card
cd paper-card
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
