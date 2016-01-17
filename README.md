[![NodeCG Logo](http://i.imgur.com/8PjMIL4.png)](http://nodecg.com/)

NodeCG is a broadcast graphics framework and application.
It is primarily aimed at [Twitch](http://twitch.tv) broadcasters using 
[Open Broadcaster Software](https://obsproject.com/), but is usable in any environment that can render HTML,
including CasparCG. NodeCG is based on the overlay system developed for the 
[Tip of the Hats 2014](https://www.youtube.com/watch?v=x9PzBHgN29U) charity event.

[![Build Status](https://travis-ci.org/nodecg/nodecg.svg?branch=master)](https://travis-ci.org/nodecg/nodecg)
[![Coverage Status](https://coveralls.io/repos/nodecg/nodecg/badge.svg?branch=master&service=github)](https://coveralls.io/github/nodecg/nodecg?branch=master)

Have questions about NodeCG, or just want to say 'hi'? Join our Gitter chatroom!  
[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/nodecg/nodecg)

## Installation
Install [node.js & npm](http://nodejs.org/).  
Then, run the following commands:
```
git clone https://github.com/nodecg/nodecg.git
cd nodecg
npm install --production
node index.js
```

To run NodeCG in production, [pm2](https://github.com/Unitech/pm2) is recommended.

## Installing bundles
NodeCG's individual graphics packages are called _bundles_. They can be installed either from the command-line
(via [_nodecg-cli_](https://www.npmjs.com/package/nodecg-cli)), or by simply placing the folder into the `./bundles` directory.

The easiest way to install bundles is via the command-line.
To install a bundle from Github, enter the owner and repository name:
```sh
nodecg install gamesdonequick/agdq16-layouts
```

... to install a bundle from Bitbucket, enter the owner and repository name prefixed with `bitbucket:`
```sh
nodecg install bitbucket:username/repo-name
```

... to install a bundle from any other git provider, enter the git URL:
```sh
nodecg install https://github.com/GamesDoneQuick/agdq16-layouts.git
```

Bundles are just directories inside the `./bundles` folder. 
They can always be added and removed by simply moving them into or out of that folder. 
Avoid installing or uninstalling bundles while NodeCG is running.

## Usage
- Install a bundle to the `bundles` folder
- Start NodeCG
- Open the dashboard (`http://localhost:9090`)
- Open a graphic from the "Graphics" menu, accessible by clicking the top-left menu button on the dashboard
- You can configure NodeCG by creating and editing [cfg/nodecg.json](http://nodecg.com/starter/configuration.html).

## Configuration
... maybe document the json schema somehow, idk

# Bundles

Each NodeCG graphic is called a _bundle_. A bundle has one or more of the following:
- _Graphics_: Visual elements to render and broadcast
- _Dashboard Panels_: Controls used to manipulate and manage the bundle
- _Extension_: Server-side code

A bundle can have multiple graphics and dashboard panels, and an extension can be split up into multiple files. 
See [nodecg-samples](http://github.com/nodecg/nodecg-samples/) for some examples of how these bundles are structured.

## Graphics

Graphics are, as the name implies, the actual graphics intended for broadcast. 
They are standard HTML webpages, and there are no restrictions on their content. 
When serving a graphic, NodeCG injects an instance of the API into the global scope.

## Dashboard Panels

Dashboard panels are the interface used to control and manage a bundle. They too are standard HTML webpages. 
Each panel is served as an iframe on the dashboard. This is done to ensure full code and style encapsulation. 
Because dashboard panels are iframes, they cannot render any content outside of their bounding box. 
For example, it is not possible to have a tooltip in a panel that extends beyond the bounding box of the panel itself.

When serving panels, NodeCG injects an instance of the API into the global scope, as well as a few default styles.

It is strongly recommended to use Polymer elements to build panels, though it is not required. 
Google's [official Polymer elements](https://elements.polymer-project.org/), specifically their 
[Paper elements](https://elements.polymer-project.org/browse?package=paper-elements), are a great place to start.
The official [NodeCGElements](https://github.com/NodeCGElements) organization also has 
a selection of Polymer elements that are integrated with NodeCG's API.

## Extensions

Extensions are server-side code. They are standard Node.js JavaScript files. An extension must export a function
that accepts a single argument. That argument will be an instance of the NodeCG API:
```js
// bundles/my-bundle/extension.js
module.exports = function(nodecg) {
    nodecg.listenFor('foo', function() {
        console.log('bar');
    });
};
```

### Bower dependencies
... talk about bower

### npm dependencies
... talk about npm

## Contributing
1. Fork it ( http://github.com/nodecg/nodecg/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

**Before creating your pull request:**

1. Ensure your code matches our existing style using our provided [EditorConfig](http://editorconfig.org/) options
2. Ensure the existing tests pass, or are updated appropriately, with `npm test`
3. For new features, you should add new tests

Check which branch you should PR to. NodeCG is still in an unstable state, so we follow these [semver](http://semver.org/) guidelines:
- Bug fixes and new features go to the next 'patch' branch (`0.current.x`)
- Breaking changes go to the next 'minor' branch (`0.next.0`)

## License
NodeCG is provided under the MIT license, which is available to read in the [LICENSE][] file.
[license]: LICENSE

## Contributors
* [Matt "Bluee" McNamara](http://mattmcn.com/)  
* [Alex "Lange" Van Camp](http://alexvan.camp)  
* ["tsc"](http://fwdcp.net)  

### Special Thanks
* [Atmo](https://github.com/atmosfar), original dashboard concept and code  
* [Alex "Lange" Van Camp](http://alexvan.camp), designer & developer of [toth-overlay](https://github.com/TipoftheHats/toth-overlay)  
