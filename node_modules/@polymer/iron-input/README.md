[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-input.svg)](https://www.npmjs.com/package/@polymer/iron-input)
[![Build status](https://travis-ci.org/PolymerElements/iron-input.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-input)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-input)

## &lt;iron-input&gt;
`<iron-input>` adds two-way binding and custom validators using `Polymer.IronValidatorBehavior`
to `<input>`.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-input),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-input/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/iron-input
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/iron-input/iron-input.js';
    </script>
  </head>
  <body>
    <iron-input>
      <input>
    </iron-input>
  </body>
</html>
```
### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/iron-input/iron-input.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <iron-input>
        <input>
      </iron-input>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Two-way binding

By default you can only get notified of changes to an `input`'s `value` due to user input:

```html
<input value="{{myValue::input}}">
```

`iron-input` adds the `bind-value` property that mirrors the `value` property, and can be used
for two-way data binding. `bind-value` will notify if it is changed either by user input or by script.

```html
<iron-input bind-value="{{bindValue}}">
  <input value="{{value::input}}">
</iron-input>
```

### Custom validators

You can use custom validators that implement `Polymer.IronValidatorBehavior` with `<iron-input>`.

```html
<iron-input auto-validate validator="my-custom-validator">
  <input placeholder="only 'cat' is valid">
 </iron-input>
```

### Stopping invalid input

It may be desirable to only allow users to enter certain characters. You can use the
`prevent-invalid-input` and `allowed-pattern` attributes together to accomplish this. This feature
is separate from validation, and `allowed-pattern` does not affect how the input is validated.

```html
<!-- only allow characters that match [0-9] -->
<iron-input allowed-pattern="[0-9]">
  <input pattern="\d{5}">
</iron-input>
```


## Contributing
If you want to send a PR to this element, here are
the instructions for running the tests and demo locally:

### Installation
```sh
git clone https://github.com/PolymerElements/iron-input
cd iron-input
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
