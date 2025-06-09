[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-localstorage.svg)](https://www.npmjs.com/package/@polymer/iron-localstorage)
[![Build status](https://travis-ci.org/PolymerElements/iron-localstorage.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-localstorage)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-localstorage)

⚠️ This element is deprecated ⚠️

## &lt;iron-localstorage&gt;
Element access to Web Storage API (window.localStorage) by keeping `value`
property in sync with localStorage.

Value is saved as json by default.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-localstorage),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-localstorage/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/iron-localstorage
```

### In an html file
```html
<html>
  <body>
    <iron-localstorage name="my-app-storage"></iron-localstorage>

    <script type="module">
      import '@polymer/iron-localstorage/iron-localstorage.js';

      const ls = document.querySelector('iron-localstorage');
      // initializes default if nothing has been stored
      function initializeDefaultCartoon() {
        ls.value = {
          name: "Mickey",
          hasEars: true
        };
      }

      ls.addEventListener(
          'iron-local-storage-load-empty', initializeDefaultCartoon);

      // use path set api to propagate changes to localstorage
      function makeModifications() {
        ls.set('value.name', "Minions");
        ls.set('value.hasEars', false);
      }
    </script>
  </body>
</html>
```

### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/iron-localstorage/iron-localstorage.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <iron-localstorage name="my-app-storage"
          value="{{cartoon}}"
          on-iron-localstorage-load-empty="initializeDefaultCartoon">
      </iron-localstorage>
    `;
  }

  static get properties() {
    return {
      cartoon: { type: Object },
    }
  }

  // initializes default if nothing has been stored
  initializeDefaultCartoon() {
    this.cartoon = {
      name: "Mickey",
      hasEars: true
    }
  }

  // use path set api to propagate changes to localstorage
  makeModifications() {
    this.set('cartoon.name', "Minions");
    this.set('cartoon.hasEars', false);
  }
}
customElements.define('sample-element', SampleElement);
```

## Contributing
If you want to send a PR to this element, here are
the instructions for running the tests and demo locally:

### Installation
```sh
git clone https://github.com/PolymerElements/iron-localstorage
cd iron-localstorage
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