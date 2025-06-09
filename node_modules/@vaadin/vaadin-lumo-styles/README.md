[![npm version](https://badgen.net/npm/v/@vaadin/vaadin-lumo-styles)](https://www.npmjs.com/package/@vaadin/vaadin-lumo-styles)
[![Bower version](https://badgen.net/github/release/vaadin/vaadin-lumo-styles)](https://github.com/vaadin/vaadin-lumo-styles/releases)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/vaadin/web-components?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)


# Lumo

> Lumo – ✨ enchantment (Finnish) and 🔆 light (Esperanto)

**Lumo is a design system foundation** for modern, beautiful and accessible web applications.

Lumo contains foundational styles – typography, colors, visual style, sizing & spacing and icons – that components and applications can use to achieve a consistent visual design.

The implementation of Lumo is based on CSS custom properties, and [Polymer style modules](https://www.polymer-project.org/2.0/docs/devguide/style-shadow-dom#style-modules). Note, that you don’t need to use Polymer to build your application in order to use Lumo.


## Documentation

*🚧 Documentation will eventually be deployed at https://vaadin.com 🚧*

For documentation and instructions how to get started, use the “Documentation” link in the latest [release notes](https://github.com/vaadin/vaadin-lumo-styles/releases).


## Part of the Vaadin platform

Lumo is maintained as a part of the [Vaadin platform](https://vaadin.com/).

[Vaadin components](https://vaadin.com/components) is a collection of web components that use the Lumo design language as their default theme. The [Vaadin app starters](https://vaadin.com/start) are also based on Lumo.


## Big Thanks

Cross-browser Testing Platform and Open Source <3 Provided by [Sauce Labs](https://saucelabs.com).


## Contributing

Reporting [issues and feature request](https://github.com/vaadin/vaadin-lumo-styles/issues/new) is a great way to help! If you have questions, join the [Vaadin components chat](https://gitter.im/vaadin/vaadin-core-elements) – we’re happy to answer Lumo related questions there.


## Running demos and tests in a browser

1. Fork the `vaadin-lumo-styles` repository and clone it locally.

1. Make sure you have [npm](https://www.npmjs.com/) and [Bower](https://bower.io) installed.

1. When in the `vaadin-lumo-styles` directory, run `npm install` and then `bower install` to install dependencies.

1. Run `npm start`, browser will automatically open the component API documentation.

1. You can also open demo/documentation by adding **demo** to the URL, for example:

  - http://127.0.0.1:3000/components/vaadin-lumo-styles/demo


## Adding or updating icons

1. Open `icons/Lumo Icons.sketch` using [Sketch](https://sketchapp.com)

1. Follow the instructions in the Sketch document

1. Run `npm install` to install dependencies

1. Run `gulp icons` to generate new versions of `iconset.html` and `font-icons.html`


## Following the coding style

We are using [ESLint](http://eslint.org/) for linting JavaScript code. You can check if your code is following our standards by running `gulp lint`, which will automatically lint all `.js` files as well as JavaScript snippets inside `.html` files. CSS inside `.html` files is also linted at the same time.


## Creating a pull request

  - Make sure your code is compliant with our code linters: `gulp lint`
  - [Submit a pull request](https://www.digitalocean.com/community/tutorials/how-to-create-a-pull-request-on-github) with detailed title and description
  - Wait for response from one of Vaadin components team members


## Updating the version number
Use `npm version <new version>` to update the version number in `package.json` and in other relevant places such as `version.html`, when preparing to release a new version.


## License

Apache License 2.0
