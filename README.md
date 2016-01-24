[![NodeCG Logo](http://i.imgur.com/8PjMIL4.png)](http://nodecg.com/)

NodeCG is a live graphics system, designed to be used in broadcasts.
It is primarily aimed at [Twitch](http://twitch.tv) broadcasters using [Open Broadcaster Software](https://obsproject.com/), but is usable in any environment that can render HTML.
NodeCG is based on the overlay system developed for the [Tip of the Hats 2014](https://www.youtube.com/watch?v=x9PzBHgN29U) charity event.

<table>
  <thead>
    <tr>
      <th>Linux</th>
      <th>OS X</th>
      <th>Test Coverage</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td colspan="2" align="center">
        <a href="https://travis-ci.org/nodecg/nodecg"><img src="https://travis-ci.org/nodecg/nodecg.svg"></a>
      </td>
      <td align="center">
        <a href="https://coveralls.io/r/nodecg/nodecg"><img src="https://img.shields.io/coveralls/nodecg/nodecg.svg"></a>
      </td>
    </tr>
  </tbody>
</table>

We currently do not perform automated tests on Windows, as we've yet to develop a good way of running our WebDriver.io
tests on it. However, a significant portion of our development is done on Windows and it is safe to assume that if the
Linux/OS X builds are passing that the Windows build is OK.

Have questions about NodeCG, or just want to say 'hi'? Join our Gitter!  
[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/nodecg/nodecg)

NodeCG provides a basic bundle system for graphics, as well as a dashboard for controlling the bundles.

A _bundle_ contains HTML, Javascript, CSS, and any other resources required to produce a certain graphic animation and also contains an admin panel for controlling the animation.
See [nodecg-samples](http://github.com/nodecg/nodecg-samples/) for some examples of how these bundles are structured.

### Installation
Install [node.js & npm](http://nodejs.org/).  
Then, run the following commands:
```
git clone https://github.com/nodecg/nodecg.git
cd nodecg
npm install --production
bower install
node index.js
```

To run NodeCG in production, [pm2](https://github.com/Unitech/pm2) is recommended.

### Usage
- Open `http://localhost:9090/dashboard` to see the admin dashboard
- For each bundle you install, you can see its graphic at `http://localhost:9090/view/{bundle-name}/`
- You can configure NodeCG by creating a [cfg/nodecg.json](http://nodecg.com/starter/configuration.html) file.

### Full Documentation
Full docs can be found at [nodecg.com](http://nodecg.com/)

### Contributing
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

### License
NodeCG is provided under the MIT license, which is available to read in the [LICENSE][] file.
[license]: LICENSE

### Contributors
* [Matt "Bluee" McNamara](http://mattmcn.com/)  
* [Alex "Lange" Van Camp](http://alexvancamp.com)  
* ["tsc"](http://fwdcp.net)  

### Credits
* [Atmo](https://github.com/atmosfar), original dashboard concept and code  
* [Alex "Lange" Van Camp](http://alexvancamp.com), lead programmer & designer of [toth-overlay](https://github.com/TipoftheHats/toth-overlay)  
