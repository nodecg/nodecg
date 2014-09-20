# NodeCG
NodeCG is a live graphics system, designed to be used during live stream events.
It is based on the overlay system used during the [Tip of the Hats 2014](https://www.youtube.com/playlist?list=PLJUPqfTTJdNnxdK5YlAo3y2jQj188jl0_) event.

NodeCG provides a basic bundle system for graphics, as well as an admin dashboard for controlling the bundles.

A _bundle_ contains HTML, Javascript, CSS, and any other resources required to produce a certain graphic animation and also contains an admin panel for controlling the animation.
See [nodecg-samples](http://github.com/nodecg/nodecg-samples/) for some examples of how these bundles are structured.

### Installation
Install [node.js & npm](http://nodejs.org/), then install [bower](http://bower.io/), then run the following:
```
git clone https://github.com/nodecg/nodecg.git
cd nodecg
npm install
node server.js
```

Alternatively, if you have [forever](https://github.com/nodejitsu/forever) installed you may run `run_nodecg.sh`

### Usage
- Open `http://localhost:9090/dashboard` to see the admin dashboard
- For each bundle you install, you can see its graphic at `http://localhost:9090/view/{bundle-name}/`
- You can configure NodeCG by creating a `config.json` file. See [config.example.json](config.example.json) for an example.

### Making bundles
- Each bundle has its own folder in /bundles/
- Each bundle should be its own git repository
- A [nodecg.json](docs/nodecg.json.md) file is required in the root directory of your bundle
- You may make an [index.js](docs/index.js.md) file in the root of your bundle to extend NodeCG.
- A bundle may have multiple panels and multiple views, though most will only have one of each

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