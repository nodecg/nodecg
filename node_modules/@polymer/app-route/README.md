[![Published on NPM](https://img.shields.io/npm/v/@polymer/app-route.svg)](https://www.npmjs.com/package/@polymer/app-route)
[![Build status](https://travis-ci.org/PolymerElements/app-route.svg?branch=master)](https://travis-ci.org/PolymerElements/app-route)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/app-route)


## &lt;app-route&gt;
`app-route` is an element that enables declarative, self-describing routing
for a web app.

See: [Documentation](https://www.webcomponents.org/element/@polymer/app-route),
  [Large Demo](https://www.webcomponents.org/element/@polymer/app-route/demo/demo/index.html),
  [Simple Demo](https://www.webcomponents.org/element/@polymer/app-route/demo/demo/simple-demo.html),
  [Data Loading Demo](https://www.webcomponents.org/element/@polymer/app-route/demo/demo/data-loading-demo.html).

## Usage

### Installation
```
npm install --save @polymer/app-route
```

### In an HTML file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/polymer/lib/elements/dom-bind.js';
      import '@polymer/app-route/app-location.js';
      import '@polymer/app-route/app-route.js';
    </script>
  </head>
  <body>
    <dom-bind>
      <template>
        <app-location route="{{route}}"></app-location>
        <app-route
            route="{{route}}"
            pattern="/:page"
            data="{{routeData}}"
            tail="{{subroute}}">
        </app-route>
        <app-route
            route="{{subroute}}"
            pattern="/:id"
            data="{{subrouteData}}">
        </app-route>
      </template>
    </dom-bind>
  </body>
</html>
```

### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/app-route/app-location.js';
import '@polymer/app-route/app-route.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <app-location route="{{route}}"></app-location>
      <app-route
          route="{{route}}"
          pattern="/:page"
          data="{{routeData}}"
          tail="{{subroute}}">
      </app-route>
      <app-route
          route="{{subroute}}"
          pattern="/:id"
          data="{{subrouteData}}">
      </app-route>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

## Contributing
If you want to send a PR to this element, here are the instructions for running
the tests and demo locally:

### Installation
```sh
git clone https://github.com/PolymerElements/app-route
cd app-route
npm install
npm install -g polymer-cli
```

### Running the demo locally
```sh
polymer serve --npm
open http://127.0.0.1:<port>/demo/index.html
open http://127.0.0.1:<port>/demo/simple-demo.html
open http://127.0.0.1:<port>/demo/data-loading-demo.html
```

### Running the tests
```sh
polymer test --npm
```