
<!---

This README is automatically generated from the comments in these files:
iron-autogrow-textarea.html

Edit those files, and our readme bot will duplicate them over here!
Edit this file, and the bot will squash your changes :)

The bot does some handling of markdown. Please file a bug if it does the wrong
thing! https://github.com/PolymerLabs/tedium/issues

-->
[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-autogrow-textarea.svg)](https://www.npmjs.com/package/@polymer/iron-autogrow-textarea)
[![Build status](https://travis-ci.org/PolymerElements/iron-autogrow-textarea.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-autogrow-textarea)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-autogrow-textarea)


## &lt;iron-autogrow-textarea&gt;

`iron-autogrow-textarea` is an element containing a textarea that grows in height as more
lines of input are entered. Unless an explicit height or the `maxRows` property is set, it will
never scroll.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-autogrow-textarea),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-autogrow-textarea/demo/demo/index.html).


  ## Usage

  ### Installation
  ```
  npm install --save @polymer/iron-autogrow-textarea
  ```

  ### In an html file
  ```html
  <html>
    <head>
      <script type="module">
        import '@polymer/iron-autogrow-textarea/iron-autogrow-textarea.js';
      </script>
    </head>
    <body>
      <iron-autogrow-textarea></iron-autogrow-textarea>
    </body>
  </html>
  ```
  ### In a Polymer 3 element
  ```js
  import {PolymerElement, html} from '@polymer/polymer';
  import '@polymer/iron-autogrow-textarea/iron-autogrow-textarea.js';

  class SampleElement extends PolymerElement {
    static get template() {
      return html`
        <iron-autogrow-textarea></iron-autogrow-textarea>
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
  git clone https://github.com/PolymerElements/iron-autogrow-textarea
  cd iron-autogrow-textarea
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
