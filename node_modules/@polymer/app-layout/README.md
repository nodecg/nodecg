[![Published on NPM](https://img.shields.io/npm/v/@polymer/app-layout.svg)](https://www.npmjs.com/package/@polymer/app-layout)
[![Build status](https://travis-ci.org/PolymerElements/app-layout.svg?branch=master)](https://travis-ci.org/PolymerElements/app-layout)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/app-layout)

## App Layout

<!---
```
<custom-element-demo height="368">
  <template>
    <script src="https://unpkg.com/@webcomponents/webcomponentsjs@^2.0.0/webcomponents-loader.js"></script>
    <script type="module">
      import '@polymer/app-layout/app-drawer/app-drawer.js';
      import '@polymer/app-layout/app-header/app-header.js';
      import '@polymer/app-layout/app-toolbar/app-toolbar.js';
      import '@polymer/app-layout/demo/sample-content.js';
      import '@polymer/iron-flex-layout/iron-flex-layout.js';
      import '@polymer/iron-icons/iron-icons.js';
      import '@polymer/paper-icon-button/paper-icon-button.js';
      import '@polymer/paper-progress/paper-progress.js';
    </script>
    <custom-style>
      <style is="custom-style">
        html, body {
          margin: 0;
          font-family: 'Roboto', 'Noto', sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #f1f1f1;
          max-height: 368px;
        }
        app-toolbar {
          background-color: #4285f4;
          color: #fff;
        }

        paper-icon-button {
          --paper-icon-button-ink-color: white;
        }

        paper-icon-button + [main-title] {
          margin-left: 24px;
        }
        paper-progress {
          display: block;
          width: 100%;
          --paper-progress-active-color: rgba(255, 255, 255, 0.5);
          --paper-progress-container-color: transparent;
        }
        app-header {
          @apply --layout-fixed-top;
          color: #fff;
          --app-header-background-rear-layer: {
            background-color: #ef6c00;
          };
        }
        app-drawer {
          --app-drawer-scrim-background: rgba(0, 0, 100, 0.8);
          --app-drawer-content-container: {
            background-color: #B0BEC5;
          }
        }
        sample-content {
          padding-top: 64px;
        }
      </style>
    </custom-style>
    <next-code-block></next-code-block>
  </template>
</custom-element-demo>
```
-->

A collection of elements, along with guidelines and templates that can be used to structure your app’s layout.

## What is inside

### Elements

- [app-box](https://github.com/PolymerElements/app-layout/tree/master/app-box) - A container element that can have scroll effects - visual effects based on scroll position.

- [app-drawer](https://github.com/PolymerElements/app-layout/tree/master/app-drawer) - A navigation drawer that can slide in from the left or right.

- [app-drawer-layout](https://github.com/PolymerElements/app-layout/tree/master/app-drawer-layout) - A wrapper element that positions an app-drawer and other content.

- [app-grid](https://github.com/PolymerElements/app-layout/tree/master/app-grid) - A helper class useful for creating responsive, fluid grid layouts using custom properties.

- [app-header](https://github.com/PolymerElements/app-layout/tree/master/app-header) - A container element for app-toolbars at the top of the screen that can have scroll effects - visual effects based on scroll position.

- [app-header-layout](https://github.com/PolymerElements/app-layout/tree/master/app-header-layout) - A wrapper element that positions an app-header and other content.

- [app-toolbar](https://github.com/PolymerElements/app-layout/tree/master/app-toolbar) - A horizontal toolbar containing items that can be used for label, navigation, search and actions.

### Templates

The templates are a means to define, illustrate and share best practices in App Layout. Pick a template and customize it:

- **Getting started**
([Demo](https://polymerelements.github.io/app-layout/templates/getting-started) - [Source](/templates/getting-started))

- **Landing page**
([Demo](https://polymerelements.github.io/app-layout/templates/landing-page) - [Source](/templates/landing-page))

- **Publishing: Zuperkülblog**
([Demo](https://polymerelements.github.io/app-layout/templates/publishing) - [Source](/templates/publishing))

- **Shop: Shrine**
([Demo](https://polymerelements.github.io/app-layout/templates/shrine) - [Source](/templates/shrine))

- **Blog: Pesto**
([Demo](https://polymerelements.github.io/app-layout/templates/pesto) - [Source](/templates/pesto))

- **Scroll effects: Test drive**
([Demo](https://polymerelements.github.io/app-layout/templates/test-drive) - [Source](/templates/test-drive))

### Patterns

Sample code for various UI patterns:

- **Transform navigation:**
As more screen space is available, side navigation can transform into tabs.
([Demo](https://www.webcomponents.org/element/PolymerElements/app-layout/demo/patterns/transform-navigation/index.html) - [Source](/patterns/transform-navigation/x-app.html))

- **Expand Card:**
Content cards may expand to take up more horizontal space.
([Demo](https://www.webcomponents.org/element/PolymerElements/app-layout/demo/patterns/expand-card/index.html) - [Source](/patterns/expand-card/index.html))

- **Material Design Responsive Toolbar:**
Toolbar changes its height and padding to adapt mobile screen size.
([Demo](https://www.webcomponents.org/element/PolymerElements/app-layout/demo/patterns/md-responsive-toolbar/index.html) - [Source](/patterns/md-responsive-toolbar/index.html))

## Users

Here are some web apps built with App Layout:

- [Youtube Web](https://www.youtube.com/new)
- [Google I/O 2016](https://events.google.com/io2016/)
- [Polymer project site](https://www.polymer-project.org/summit)
- [Polymer summit](https://www.polymer-project.org/summit)
- [Shop](https://shop.polymer-project.org)
- [News](https://news.polymer-project.org)
- [webcomponents.org](https://www.webcomponents.org/)
- [Chrome Status](https://www.chromestatus.com/)
- [Project Fi](https://fi.google.com/about/)
- [NASA Open Source Software](https://code.nasa.gov/)

See: [Documentation](https://www.webcomponents.org/element/@polymer/app-layout),
  [Demo](https://www.webcomponents.org/element/@polymer/app-layout/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/app-layout
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/app-layout/app-layout.js';
    </script>
  </head>
  <body>
    <app-header reveals>
      <app-toolbar>
        <div main-title>My app</div>
      </app-toolbar>
    </app-header>
    <app-drawer id="drawer" swipe-open></app-drawer>
  </body>
</html>
```
### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/app-layout/app-layout.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <app-header reveals>
        <app-toolbar>
          <div main-title>My app</div>
        </app-toolbar>
      </app-header>
      <app-drawer id="drawer" swipe-open></app-drawer>
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
git clone https://github.com/PolymerElements/app-layout
cd app-layout
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
