[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-location.svg)](https://www.npmjs.com/package/@polymer/iron-location)
[![Build status](https://travis-ci.org/PolymerElements/iron-location.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-location)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-location)

## iron-location
The iron-location elements manage bindings to and from the current URL and query
parameters.
See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-location),
  [iron-location demo](https://www.webcomponents.org/element/@polymer/iron-location/demo/demo/index.html),
  [iron-query-params demo](https://www.webcomponents.org/element/@polymer/iron-location/demo/demo/iron-query-params.html).

### &lt;iron-location&gt;

The `iron-location` element manages binding to and from the current URL.

### &lt;iron-query-params&gt;

The `iron-query-params` element manages serialization and parsing of query
parameter strings.

## Usage

### Installation
```
npm install --save @polymer/iron-location
```

### In an html file

##### &lt;iron-location&gt;
```html
<html>
  <head>
    <script type="module">
      import '@polymer/iron-location/iron-location.js';
    </script>
  </head>
  <body>
    <iron-location
        path="/social/profiles"
        hash="profilePicture"
        query="userId=polymer&display=dark"
        dwell-time="1000">
    </iron-location>
  </body>
</html>
```

#### &lt;iron-query-params&gt;
```html
<html>
  <head>
    <script type="module">
      import '@polymer/polymer/lib/elements/dom-bind.js';
      import '@polymer/iron-location/iron-location.js';
      import '@polymer/iron-location/iron-query-params.js';
    </script>
  </head>
  <body>
    <dom-bind>
      <template>
        <iron-location
            path="/social/profiles"
            hash="profilePicture"
            query="{{paramsString}}"
            dwell-time="1000">
        </iron-location>
        <iron-query-params
            id="queryParams"
            params-string='{{paramsString}}'
            params-object='{"userId": "polymer", "display": "dark"}'>
        </iron-query-params>
      </template>
    </dom-bind>
  </body>
</html>
```

### In a Polymer 3 element

##### &lt;iron-location&gt;
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/iron-location/iron-location.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <iron-location
          path="/social/profiles"
          hash="profilePicture"
          query="userId=polymer&display=dark"
          dwell-time="1000">
      </iron-location>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

#### &lt;iron-query-params&gt;
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/iron-location/iron-location.js';
import '@polymer/iron-location/iron-query-params.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <iron-location
          path="/social/profiles"
          hash="profilePicture"
          query="{{paramsString}}"
          dwell-time="1000">
      </iron-location>
      <iron-query-params
          id="queryParams"
          params-string='{{paramString}}'
          params-object='{"userId": "polymer", "display": "dark"}'>
      </iron-query-params>
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
git clone https://github.com/PolymerElements/iron-location
cd iron-location
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