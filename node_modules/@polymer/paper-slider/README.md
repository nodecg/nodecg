[![Published on NPM](https://img.shields.io/npm/v/@polymer/paper-slider.svg)](https://www.npmjs.com/package/@polymer/paper-slider)
[![Build status](https://travis-ci.org/PolymerElements/paper-slider.svg?branch=master)](https://travis-ci.org/PolymerElements/paper-slider)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/paper-slider)

## &lt;paper-slider&gt;
Material design: [Sliders](https://www.google.com/design/spec/components/sliders.html)

`paper-slider` allows user to select a value from a range of values by
moving the slider thumb.  The interactive nature of the slider makes it a
great choice for settings that reflect intensity levels, such as volume,
brightness, or color saturation.

See: [Documentation](https://www.webcomponents.org/element/@polymer/paper-slider),
  [Demo](https://www.webcomponents.org/element/@polymer/paper-slider/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/paper-slider
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/paper-slider/paper-slider.js';
    </script>
  </head>
  <body>
    <paper-slider
        value="183"
        max="255"
        secondary-progress="200"
        editable>
    </paper-slider>
  </body>
</html>
```
### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/paper-slider/paper-slider.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <paper-slider
        value="183"
        max="255"
        secondary-progress="200"
        editable>
    </paper-slider>
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
git clone https://github.com/PolymerElements/paper-slider
cd paper-slider
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