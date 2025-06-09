[![Published on NPM](https://img.shields.io/npm/v/@polymer/paper-styles.svg)](https://www.npmjs.com/package/@polymer/paper-styles)
[![Build status](https://travis-ci.org/PolymerElements/paper-styles.svg?branch=master)](https://travis-ci.org/PolymerElements/paper-styles)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/paper-styles)

## &lt;paper-styles&gt;
1. [default-theme.js](https://github.com/PolymerElements/paper-styles/blob/master/default-theme.html): text,
background and accent colors that match the default Material Design theme

1. [shadow.js](https://github.com/PolymerElements/paper-styles/blob/master/shadow.html): Material Design
[elevation](https://material.io/design/environment/light-shadows.html#shadows) and shadow styles

1. [typography.js](https://github.com/PolymerElements/paper-styles/blob/master/typography.html):
Material Design [font](http://www.google.com/design/spec/style/typography.html#typography-styles) styles and sizes

1. [demo-pages.js](https://github.com/PolymerElements/paper-styles/blob/master/demo-pages.html): generic styles
used in the PolymerElements demo pages

1. [color.js](https://github.com/PolymerElements/paper-styles/blob/master/color.html):
a complete list of the colors defined in the Material Design [palette](https://www.google.com/design/spec/style/color.html)

We recommend importing each of these individual files, and using the style mixins
available in each ones, rather than the aggregated `paper-styles.html` as a whole.

See: [Documentation](https://www.webcomponents.org/element/@polymer/paper-styles),
  [Demo](https://www.webcomponents.org/element/@polymer/paper-styles/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/paper-styles
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/paper-styles/typography.js';
      import {html} from '@polymer/polymer/lib/utils/html-tag.js';

      const template = html`
      <custom-style>
        <style is="custom-style" include="paper-material-styles">
          .paper-font-headline {
            @apply --paper-font-headline;
          }
        </style>
      </custom-style>`;
      document.body.appendChild(template.content);
    </script>
  </head>
  <body>
    <div class="paper-font-headline">Headline</div>
    <div class="paper-material" elevation="3">This is a lifted paper</div>
  </body>
</html>
```
### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/paper-styles/typography.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <style is="custom-style" include="paper-material-styles">
        .paper-font-headline {
          @apply --paper-font-headline;
        }
      </style>
      <div class="paper-font-headline">Headline</div>
      <div class="paper-material" elevation="3">This is a lifted paper</div>
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
git clone https://github.com/PolymerElements/paper-styles
cd paper-styles
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
