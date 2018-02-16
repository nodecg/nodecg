# NodeCG

[![NodeCG](https://raw.githubusercontent.com/nodecg/nodecg/master/media/splash.png)](http://nodecg.com/)

[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/nodecg/nodecg)
[![Build Status](https://travis-ci.org/nodecg/nodecg.svg?branch=master)](https://travis-ci.org/nodecg/nodecg)
[![Coverage Status](https://coveralls.io/repos/nodecg/nodecg/badge.svg?branch=master&service=github)](https://coveralls.io/github/nodecg/nodecg?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/nodecg/nodecg.svg)](https://greenkeeper.io/)
[![NSP Status](https://nodesecurity.io/orgs/nodecg/projects/4b34d59a-9ba1-47fb-a1fe-c4d04be91bdc/badge)](https://nodesecurity.io/orgs/nodecg/projects/4b34d59a-9ba1-47fb-a1fe-c4d04be91bdc)
[![Docker Build Status](https://img.shields.io/docker/build/nodecg/nodecg.svg)](https://hub.docker.com/r/nodecg/nodecg/tags/)
[![Twitter](https://img.shields.io/twitter/url/https/twitter.com/fold_left.svg?style=social&label=Follow%20%40NodeCG)](https://twitter.com/NodeCG)

> Create broadcast graphics using Node.js and a browser

NodeCG is a broadcast graphics framework and application. It enables you to write complex, dynamic broadcast graphics
using the web platform. NodeCG has no graphics or drawing primitives of its own. Instead, NodeCG provides
a structure for your code and an API to facilitate moving data between the dashboard, the server, and your graphics.
It makes no assumptions about how to best code a graphic, and gives you complete freedom to use whatever libraries, 
frameworks, tools, and methodologies you want. As such, NodeCG graphics can be rendered in any environment that
can render HTML, including:

-   [OBS Studio](https://obsproject.com/) (via the [obs-browser](https://github.com/kc5nra/obs-browser) plugin)
-   [vMix](http://www.vmix.com/)
-   [XSplit](https://www.xsplit.com/)

> Don't see your preferred streaming software on this list? NodeCG graphics require Chrome 49 or newer. If your streaming software's implementation of browser source uses a build of CEF that is based on at least Chrome 49, chances are that NodeCG graphics will work in it. You can check what version of Chrome your streaming software uses for its browser sources by opening [whatversion.net/chrome](http://www.whatversion.net/chrome) as a browser source.

Looking for a list of NodeCG bundles and resources? Check out [awesome-nodecg](https://github.com/nodecg/awesome-nodecg/blob/master/README.md).

Have questions about NodeCG, or just want to say 'hi'? [Join our Gitter chatroom](https://gitter.im/nodecg/nodecg)!

**Who should use NodeCG?**

NodeCG is a programming framework. As such, it's most useful to developers capable of creating their own graphics
using HTML, CSS, and JavaScript. NodeCG is still in beta and the ecosystem of bundles is quite small.
Those expecting to download NodeCG and use off-the-shelf bundles to get a complete stream overlay
without writing any code may be disappointed.

## Table of Contents

-   [Install](#install)
    -   [Installing bundles](#installing-bundles)
-   [Usage](#usage)
    -   [Configuration](#configuration)
-   [Bundles](#bundles)
    -   [Graphics](#graphics)
    -   [Dashboard Panels](#dashboard-panels)
    -   [Extensions](#extensions)
    -   [package.json manifest](#packagejson-manifest)
-   [Maintainers](#maintainers)
    -   [Special Thanks](#special-thanks)
-   [Contribute](#contribute)
    -   [Building and viewing the docs locally](#building-and-viewing-the-docs-locally)
    -   [Running tests locally](#running-tests-locally)
    -   [Code of Conduct](#code-of-conduct)
-   [License](#license)

## Install

Install [Node.js (version 6 or greater) & npm (version 2 or greater)](http://nodejs.org/).  

Then, run the following commands from a terminal (command prompt):

```sh
npm install -g bower
git clone https://github.com/nodecg/nodecg.git
cd nodecg
npm install --production
bower install
node index.js
```

To run NodeCG in production, [pm2](https://github.com/Unitech/pm2) is recommended.

### Installing bundles

NodeCG's individual graphics packages are called _bundles_. They can be installed either from the command-line
(via [_nodecg-cli_](https://www.npmjs.com/package/nodecg-cli)), or by simply placing the folder into the `./bundles` directory.

The easiest way to install bundles is via the command-line using [nodecg-cli](https://www.npmjs.com/package/nodecg-cli).
You will need to install [nodecg-cli](https://www.npmjs.com/package/nodecg-cli) before you can use the `nodecg`
terminal commands.

(Once you have [nodecg-cli](https://www.npmjs.com/package/nodecg-cli) installed) To install a bundle from Github, enter the owner and repository name:

```sh
nodecg install lange/lange-notify
```

... to install a bundle from Bitbucket, enter the owner and repository name prefixed with `bitbucket:`

```sh
nodecg install bitbucket:username/repo-name
```

... to install a bundle from any other git provider, enter the git URL:

```sh
nodecg install https://gitlab.com/username/repo-name.git
```

Bundles are just directories inside the `./bundles` folder. 
They can always be added and removed by simply moving them into or out of that folder. 
Avoid installing or uninstalling bundles while NodeCG is running.

## Usage

-   Install a bundle to the `bundles` folder.
-   Start NodeCG (`node index.js` or `nodecg start` if you have [nodecg-cli](https://www.npmjs.com/package/nodecg-cli) installed).
-   Open the dashboard (`http://localhost:9090` by default).
-   Open a graphic from the "Graphics" menu.
-   You can configure NodeCG by creating and editing [cfg/nodecg.json](http://nodecg.com/tutorial-nodecg-configuration.html).

### Configuration

`./cfg/nodecg.json` is an optional file that you can create to configure NodeCG.
See the [NodeCG Configuration tutorial](http://nodecg.com/tutorial-nodecg-configuration.html) for more information on configuring NodeCG.

## Bundles

Each NodeCG graphic is called a _bundle_. A bundle has one or more of the following:

-   _Graphics_: Visual elements to render and broadcast.
-   _Dashboard Panels_: Controls used to manipulate and manage the bundle.
-   _Extension_: Server-side code.

A bundle can have multiple graphics and dashboard panels, and an extension can be split up into multiple files.

If you wish to quickly start a new bundle from a template, try [generator-nodecg](https://github.com/nodecg/generator-nodecg).

### Graphics

Graphics are, as the name implies, the actual graphics intended for broadcast. 
They are standard HTML webpages, and there are no restrictions on their content. 
When serving a graphic, NodeCG injects an instance of the API into the global scope.

### Dashboard Panels

Dashboard panels are the interface used to control and manage a bundle. They too are standard HTML webpages. 
Each panel is served as an iframe on the dashboard. This is done to ensure full code and style encapsulation. 
Because dashboard panels are iframes, they cannot render any content outside of their bounding box. 
For example, it is not possible to have a tooltip in a panel that extends beyond the bounding box of the panel itself.

When serving panels, NodeCG injects an instance of the API into the global scope, as well as a few default styles.

It is strongly recommended to use Polymer elements to build panels, though it is not required. 
Google's [official Polymer elements](https://www.webcomponents.org/collection/Polymer/elements), specifically their 
[Paper elements](https://www.webcomponents.org/collection/PolymerElements/paper-elements), are a great place to start.
The official [nodecg-dashboard-elements](https://www.webcomponents.org/collection/NodeCGElements/nodecg-dashboard-elements) 
collection also has a selection of Polymer elements that are integrated with NodeCG's API.

### Extensions

Extensions are server-side code. They are standard Node.js JavaScript files. An extension must export a function
that accepts a single argument. That argument will be an instance of the NodeCG API:

```js
// bundles/my-bundle/extension.js
module.exports = nodecg => {
    nodecg.listenFor('foo', () => {
        console.log('bar');
    });
};
```

NodeCG automatically attempts to load the following files as extensions:

-   `your-bundle/extension.js`
-   `your-bundle/extension/index.js`

Bundles may have one of, but not both of the above files. If your extension is simple enough to fit in one file,
use the former approach. If your extension is broken up into multiple files, you may want to use the latter structure
and keep all those files in a single `extension` folder. If using an `extension` folder, **NodeCG will only load
`your-bundle/extension/index.js`**. It is up to you to load any other files that your extension needs via `require`.

### `package.json` manifest

Every bundle must have a [`package.json`](https://docs.npmjs.com/files/package.json). In addition to the required fields
like `name` and `version` outlined in that link, NodeCG bundles must also have a `nodecg` object in their `package.json`
with some additional properties that tell NodeCG about the bundle and how to load it.

See the [manifest tutorial](http://nodecg.com/tutorial-manifest.html) for more information on creating a valid `package.json` for a bundle.

## Maintainers

-   [Matt "Bluee" McNamara](http://mattmcn.com/)  
-   [Alex "Lange" Van Camp](http://alexvan.camp)  
-   ["tsc"](http://fwdcp.net)  
-   [Chris Hanel](http://www.chrishanel.com)

### Special Thanks

-   [Atmo](https://github.com/atmosfar), original dashboard concept and code  
-   [Alex "Lange" Van Camp](http://alexvan.camp), designer & developer of [toth-overlay](https://github.com/TipoftheHats/toth-overlay)  

## Contribute

Please contribute! This is an open source project. If you would like to report a bug or suggest a feature, [open an issue](https://github.com/nodecg/nodecg/issues). Or, to open a Pull Request:

1.  Fork it (<http://github.com/nodecg/nodecg/fork>)
2.  Create your feature branch (`git checkout -b my-new-feature`)
3.  Commit your changes (`git commit -am 'Add some feature'`)
4.  Push to the branch (`git push origin my-new-feature`)
5.  Create a new Pull Request

Note: Make sure you run `npm install` in the root directory without the `--production` flag to ensure all `devDependencies` are installed.

**Before creating your pull request:**

1.  Ensure your code matches our existing style using our provided [EditorConfig](http://editorconfig.org/) options.
2.  Ensure the existing tests pass, or are updated appropriately, with `npm test`.
3.  For new features, you should add new tests.

Check which branch you should PR to. NodeCG is still in an unstable state, so we follow these [semver](http://semver.org/) guidelines:

-   Bug fixes and new features go to the next 'patch' branch (`0.current.x`)
-   Breaking changes go to the next 'minor' branch (`0.next.0`)

### Building and viewing the docs locally

Documentation contributions are always welcome and very appreciated!

NodeCG's documentation site, [nodecg.com](http://nodecg.com), is automatically generated based on NodeCG's JSDoc comments and the markdown files in the [`tutorials`](https://github.com/nodecg/nodecg/tree/master/tutorials) folder. The [table of contents](#table-of-contents) in this README is also automatically generated.

To build the docs, run the following commands (after you have cloned NodeCG and installed its dependencies via `npm install`):

```bash
npm run docs:build
```

After that, you can open `docs/index.html` directly in your web browser.

Once you've made your changes, follow the steps above in the [Contribute](#contribute) section to open a pull request.

### Running tests locally

1.  Install selenium-standalone (`npm install --global selenium-standalone`), then run the installer (`selenium-standalone install`)
2.  Open one terminal and start Selenium: `selenium-standalone start`
3.  Open a second terminal, navigate to the NodeCG root and run `npm test`

Note: Selenium requires [Java](https://www.java.com/en/download/help/download_options.xml).

### Code of Conduct

Note that all contributions and discussions around NodeCG take place under our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT Liencese](https://github.com/nodecg/nodecg/blob/master/LICENSE) © 2017 Alex Van Camp, Matthew McNamara, and contributors
