[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-collapse.svg)](https://www.npmjs.com/package/@polymer/iron-collapse)
[![Build status](https://travis-ci.org/PolymerElements/iron-collapse.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-collapse)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-collapse)

## &lt;iron-collapse&gt;
`iron-collapse` creates a collapsible block of content.  By default, the content
will be collapsed.  Use `opened` or `toggle()` to show/hide the content. The
aria-expanded attribute should only be set on the button that controls the
collapsable area, not on the area itself. See
https://www.w3.org/WAI/GL/wiki/Using_aria-expanded_to_indicate_the_state_of_a_collapsible_element#Description

`iron-collapse` adjusts the max-height/max-width of the collapsible element to show/hide
the content.  So avoid putting padding/margin/border on the collapsible directly,
and instead put a div inside and style that.

```html
<style>
  .collapse-content {
    padding: 15px;
    border: 1px solid #dedede;
  }
</style>

<iron-collapse>
  <div class="collapse-content">
    <div>Content goes here...</div>
  </div>
</iron-collapse>
```

### Styling

The following custom properties and mixins are available for styling:

| Custom property | Description | Default |
| --- | --- | --- |
| `--iron-collapse-transition-duration` | Animation transition duration | `300ms` |

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-collapse),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-collapse/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/iron-collapse
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/iron-collapse/iron-collapse.js';
    </script>
  </head>
  <body>
    <iron-collapse id="collapse">
      <div>Content goes here...</div>
    </iron-collapse>
  </body>
</html>
```
### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/iron-collapse/iron-collapse.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <iron-collapse id="collapse">
        <div>Content goes here...</div>
      </iron-collapse>
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
git clone https://github.com/PolymerElements/iron-collapse
cd iron-collapse
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
