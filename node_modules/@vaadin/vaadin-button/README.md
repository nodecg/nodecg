[![npm version](https://badgen.net/npm/v/@vaadin/vaadin-button)](https://www.npmjs.com/package/@vaadin/vaadin-button)
[![Bower version](https://badgen.net/github/release/vaadin/vaadin-button)](https://github.com/vaadin/vaadin-button/releases)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/vaadin/vaadin-button)
[![Build Status](https://travis-ci.org/vaadin/vaadin-button.svg?branch=master)](https://travis-ci.org/vaadin/vaadin-button)
[![Coverage Status](https://coveralls.io/repos/github/vaadin/vaadin-button/badge.svg?branch=master)](https://coveralls.io/github/vaadin/vaadin-button?branch=master)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/vaadin/web-components?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

[![Published on Vaadin  Directory](https://img.shields.io/badge/Vaadin%20Directory-published-00b4f0.svg)](https://vaadin.com/directory/component/vaadinvaadin-button)
[![Stars on vaadin.com/directory](https://img.shields.io/vaadin-directory/star/vaadinvaadin-button.svg)](https://vaadin.com/directory/component/vaadinvaadin-button)

# &lt;vaadin-button&gt;

[Live Demo ↗](https://vaadin.com/components/vaadin-button/html-examples)
|
[API documentation ↗](https://vaadin.com/components/vaadin-button/html-api)

[&lt;vaadin-button&gt;](https://vaadin.com/components/vaadin-button) is a Web Component providing an accessible and customizable button, part of the [Vaadin components](https://vaadin.com/components).

<!--
```
<custom-element-demo>
  <template>
    <script src="../webcomponentsjs/webcomponents-lite.js"></script>
    <link rel="import" href="vaadin-button.html">
    <next-code-block></next-code-block>
  </template>
</custom-element-demo>
```
-->
```html
<vaadin-button theme="primary">Primary</vaadin-button>
<vaadin-button theme="secondary">Secondary</vaadin-button>
<vaadin-button theme="tertiary">Tertiary</vaadin-button>
```

[<img src="https://raw.githubusercontent.com/vaadin/vaadin-button/master/screenshot.png" alt="Screenshot of vaadin-button, using the default Lumo theme">](https://vaadin.com/components/vaadin-button)

## Installation

The Vaadin components are distributed as Bower and npm packages.
Please note that the version range is the same, as the API has not changed.
You should not mix Bower and npm versions in the same application, though.

Unlike the official Polymer Elements, the converted Polymer 3 compatible Vaadin components
are only published on npm, not pushed to GitHub repositories.

### Polymer 2 and HTML Imports compatible version

Install `vaadin-button`:

```sh
bower i vaadin/vaadin-button --save
```

Once installed, import it in your application:

```html
<link rel="import" href="bower_components/vaadin-button/vaadin-button.html">
```
### Polymer 3 and ES Modules compatible version

Install `vaadin-button`:

```sh
npm i @vaadin/vaadin-button --save
```

Once installed, import it in your application:

```js
import '@vaadin/vaadin-button/vaadin-button.js';
```

## Getting started

Vaadin components use the Lumo theme by default.

To use the Material theme, import the correspondent file from the `theme/material` folder.

## Entry points

- The component with the Lumo theme:

  `theme/lumo/vaadin-button.html`

- The component with the Material theme:

  `theme/material/vaadin-button.html`

- Alias for `theme/lumo/vaadin-button.html`:

  `vaadin-button.html`


## Running demos and tests in a browser

1. Fork the `vaadin-button` repository and clone it locally.

1. Make sure you have [npm](https://www.npmjs.com/) and [Bower](https://bower.io) installed.

1. When in the `vaadin-button` directory, run `npm install` and then `bower install` to install dependencies.

1. Run `npm start`, browser will automatically open the component API documentation.

1. You can also open demo or in-browser tests by adding **demo** or **test** to the URL, for example:

  - http://127.0.0.1:3000/components/vaadin-button/demo
  - http://127.0.0.1:3000/components/vaadin-button/test


## Running tests from the command line

1. When in the `vaadin-button` directory, run `polymer test`


## Following the coding style

We are using [ESLint](http://eslint.org/) for linting JavaScript code. You can check if your code is following our standards by running `npm run lint`, which will automatically lint all `.js` files as well as JavaScript snippets inside `.html` files.


## Big Thanks

Cross-browser Testing Platform and Open Source <3 Provided by [Sauce Labs](https://saucelabs.com).


## Contributing

  To contribute to the component, please read [the guideline](https://github.com/vaadin/vaadin-core/blob/master/CONTRIBUTING.md) first.


## License

Apache License 2.0

Vaadin collects development time usage statistics to improve this product. For details and to opt-out, see https://github.com/vaadin/vaadin-usage-statistics.
