[![NodeCG Logo](http://i.imgur.com/aNJNQis.png)](http://github.com/nodecg/nodecg)

NodeCG is a live graphics system, designed to be used in live broadcasts.
It is primarily aimed at [Twitch](http://twitch.tv) broadcasters using [Open Broadcaster Software](https://obsproject.com/), but is usable in any environment that can render HTML.
NodeCG is based on the overlay system developed for the [Tip of the Hats 2014](https://www.youtube.com/watch?v=x9PzBHgN29U) charity event.

[![Build Status](https://travis-ci.org/nodecg/nodecg.svg?branch=master)](https://travis-ci.org/nodecg/nodecg)
[![Coverage Status](https://img.shields.io/coveralls/nodecg/nodecg.svg)](https://coveralls.io/r/nodecg/nodecg)

NodeCG provides a basic bundle system for graphics, as well as an control dashboard for controlling the bundles.

A _bundle_ contains HTML, Javascript, CSS, and any other resources required to produce a certain graphic animation and also contains an admin panel for controlling the animation.
See [nodecg-samples](http://github.com/nodecg/nodecg-samples/) for some examples of how these bundles are structured.

### Installation
First, install [node.js & npm](http://nodejs.org/).  
Next, you'll need to install [Python 2.7](https://www.python.org/) on Windows. Mac OS X and Linux should have this already.  
Finally, install [Visual Studio Express](http://go.microsoft.com/?linkid=9816758) on Windows, Xcode on OS X, and `build-essential` (or equivalent) on Linux.  
Now run the following commands:
```
git clone https://github.com/nodecg/nodecg.git
cd nodecg
npm install --production
node server.js
```

To run NodeCG in production, [pm2](https://github.com/Unitech/pm2) is recommended.

### Usage
- Open `http://localhost:9090/dashboard` to see the admin dashboard
- For each bundle you install, you can see its graphic at `http://localhost:9090/view/{bundle-name}/`
- You can configure NodeCG by creating a [cfg/nodecg.json](https://github.com/nodecg/nodecg/wiki/NodeCG-config) file.

### Full Documentation
Full docs can be found in the [wiki](https://github.com/nodecg/nodecg/wiki).

### Contributing
1. Fork it ( http://github.com/nodecg/nodecg/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

### License
NodeCG is provided under the MIT license, which is available to read in the [LICENSE][] file.
[license]: LICENSE

### Credits
[Alex "Lange" Van Camp](http://alexvancamp.com), lead programmer & designer of [toth-overlay](https://github.com/Langeh/toth-overlay), contributor to NodeCG  
[Matt "Bluee" McNamara](http://mattmcn.com/), contributor to NodeCG  
[Atmo](https://github.com/atmosfar), original dashboard concept and code  
