# &lt;vaadin-upload&gt;

> ⚠️ Starting from Vaadin 20, the source code and issues for this component are migrated to the [`vaadin/web-components`](https://github.com/vaadin/web-components/tree/master/packages/vaadin-upload) monorepository.
> This repository contains the source code and releases of `<vaadin-upload>` for the Vaadin versions 10 to 19.

[&lt;vaadin-upload&gt;](https://vaadin.com/components/vaadin-upload) is a Web Component for uploading files, part of the [Vaadin components](https://vaadin.com/components).

[Live Demo ↗](https://vaadin.com/components/vaadin-upload/html-examples/upload-basic-demos)
|
[API documentation ↗](https://vaadin.com/components/vaadin-upload/html-api)

[![npm version](https://badgen.net/npm/v/@vaadin/vaadin-upload)](https://www.npmjs.com/package/@vaadin/vaadin-upload)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/vaadin/vaadin-upload)
[![Published on Vaadin Directory](https://img.shields.io/badge/Vaadin%20Directory-published-00b4f0.svg)](https://vaadin.com/directory/component/vaadinvaadin-upload)
[![Discord](https://discordapp.com/api/guilds/732335336448852018/widget.png)](https://vaad.in/chat)

<!---
```
<custom-element-demo>
  <template>
    <script src="../webcomponentsjs/webcomponents-lite.js"></script>
    <script src="https://cdn.vaadin.com/vaadin-elements/master/mock-http-request/lib/mock.js"></script>
    <link rel="import" href="vaadin-upload.html">
    <script>
      function mockXhrGenerator(file) {
        var xhr = new MockHttpRequest();
        xhr.upload = {};
        xhr.onsend = function() {
          var total = file && file.size || 1024, done = 0;
          function start() {
            setTimeout(progress, 1000);
          }
          function progress() {
            xhr.upload.onprogress({total: total, loaded: done});
            if (done < total) {
              setTimeout(progress, 200);
              done = Math.min(total, done + 254000);
            } else if (!file.abort) {
              setTimeout(finish, 1000);
            }
          }
          function finish() {
            xhr.receive(200, '{"message":"OK"}');
          }
          start();
        };
        return xhr;
      }

      window.addEventListener('WebComponentsReady', function() {
        // Monkey-patch vaadin-upload prototype to use MockHttpRequest
        Object.getPrototypeOf(document.createElement('vaadin-upload'))._createXhr = mockXhrGenerator;
      });
    </script>

    <next-code-block></next-code-block>
  </template>
</custom-element-demo>
```
-->
```html
<vaadin-upload accept=".pdf">
  <span slot="drop-label">Drop your favourite Novels here (PDF files only)</span>
</vaadin-upload>
```

[<img src="https://raw.githubusercontent.com/vaadin/vaadin-upload/master/screenshot.png" alt="Screenshot of vaadin-upload" width="670" />](https://vaadin.com/components/vaadin-upload)

## Installation

The Vaadin components are distributed as Bower and npm packages.
Please note that the version range is the same, as the API has not changed.
You should not mix Bower and npm versions in the same application, though.

Unlike the official Polymer Elements, the converted Polymer 3 compatible Vaadin components
are only published on npm, not pushed to GitHub repositories.

### Polymer 2 and HTML Imports Compatible Version

Install `vaadin-upload`:

```sh
bower i vaadin/vaadin-upload --save
```

Once installed, import it in your application:

```html
<link rel="import" href="bower_components/vaadin-upload/vaadin-upload.html">
```
### Polymer 3 and ES Modules Compatible Version

Install `vaadin-upload`:

```sh
npm i @vaadin/vaadin-upload --save
```

Once installed, import it in your application:

```js
import '@vaadin/vaadin-upload/vaadin-upload.js';
```

## Getting started

Vaadin components use the Lumo theme by default.

To use the Material theme, import the correspondent file from the `theme/material` folder.

## Entry points

- The component with the Lumo theme:

  `theme/lumo/vaadin-upload.html`

- The component with the Material theme:

  `theme/material/vaadin-upload.html`

- Alias for `theme/lumo/vaadin-upload.html`:

  `vaadin-upload.html`


## Running demos and tests in a browser

1. Fork the `vaadin-upload` repository and clone it locally.

1. Make sure you have [npm](https://www.npmjs.com/) and [Bower](https://bower.io) installed.

1. When in the `vaadin-upload` directory, run `npm install` and then `bower install` to install dependencies.

1. Run `npm start`, browser will automatically open the component API documentation.

1. You can also open demo or in-browser tests by adding **demo** or **test** to the URL, for example:

  - http://127.0.0.1:3000/components/vaadin-upload/demo
  - http://127.0.0.1:3000/components/vaadin-upload/test


## Running tests from the command line

1. When in the `vaadin-upload` directory, run `polymer test`


## Following the coding style

We are using [ESLint](http://eslint.org/) for linting JavaScript code. You can check if your code is following our standards by running `npm run lint`, which will automatically lint all `.js` files as well as JavaScript snippets inside `.html` files.


## Big Thanks

Cross-browser Testing Platform and Open Source <3 Provided by [Sauce Labs](https://saucelabs.com).


## Contributing

  To contribute to the component, please read [the guideline](https://github.com/vaadin/vaadin-core/blob/master/CONTRIBUTING.md) first.


## License

Apache License 2.0

Vaadin collects development time usage statistics to improve this product. For details and to opt-out, see https://github.com/vaadin/vaadin-usage-statistics.
