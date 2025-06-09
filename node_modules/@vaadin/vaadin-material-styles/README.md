[![npm version](https://badgen.net/npm/v/@vaadin/vaadin-material-styles)](https://www.npmjs.com/package/@vaadin/vaadin-material-styles)
[![Bower version](https://badgen.net/github/release/vaadin/vaadin-material-styles)](https://github.com/vaadin/vaadin-material-styles/releases)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/vaadin/web-components?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

# Material Theme for Vaadin components

`vaadin-material-styles` is customizable theme for the [Vaadin components](https://vaadin.com/components).


## Running demos and tests in browser

1. Fork the `vaadin-material-styles` repository and clone it locally.

1. Make sure you have [npm](https://www.npmjs.com/) installed.

1. When in the `vaadin-material-styles` directory, run `npm install` and then `bower install` to install dependencies.

1. Run `polymer serve --open`, browser will automatically open the component API documentation.

1. You can also open demo or in-browser tests by adding **demo** or **test** to the URL, for example:

  - http://127.0.0.1:8080/components/vaadin-material-styles/demo
  - http://127.0.0.1:8080/components/vaadin-material-styles/test


## Running tests from the command line

1. When in the `vaadin-material-styles` directory, run `polymer test`


## Following the coding style

We are using [ESLint](http://eslint.org/) for linting JavaScript code. You can check if your code is following our standards by running `gulp lint`, which will automatically lint all `.js` files as well as JavaScript snippets inside `.html` files.


## Creating a pull request

  - Make sure your code is compliant with our code linters: `gulp lint`
  - Check that tests are passing: `polymer test`
  - [Submit a pull request](https://www.digitalocean.com/community/tutorials/how-to-create-a-pull-request-on-github) with detailed title and description
  - Wait for response from one of Vaadin components team members


## License

Apache License 2.0
