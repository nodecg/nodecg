##Schema
- `name` String. The name of your package, must be unique. No two packages with identical names may be installed at the same time.

- `version` [Semver](http://www.jakobm.com/semver-in-nodejs-and-npm) string. The version of your package.

- `nodecgDependency` [Semver](http://www.jakobm.com/semver-in-nodejs-and-npm) string. Which version \[range\]  of NodeCG your bundle depends on. **If this is not satisfied, your bundle will not load.**

- `description` String. A brief description of what this package is and does.

- `homepage` String. A link to the homepage or repository of this package.

- `authors` Array of strings. The authors of this package.

- `resolutions` Array of strings. Most packages will only run at a single resolution. Currently used only for informational displays to the end user. Values should be stated as "720p", "1080p", "1440p", etc.

- `license` String. The license used by your package (i.e., MIT, GPLv3).

- `extension` (optional) Object. Describes the [NodeCG extension](extensions.md) entry point, if any.

    - `express` Boolean. Whether or not the extension exports an express app.

    - `path` String. The file path to the main extension file. This will be mounted by `require`.

- `bundleDependencies` (optional) Array. Names of the bundles your bundle depends on, if any.

##Example
```json
{
  "name": "toth-alert",
  "version": "0.0.1",
  "nodecgDependency": "^0.1.0",
  "description": "Simple pop-in informational display",
  "homepage": "http://tipofthehats.org/",
  "authors": [
    "Alex Van Camp <email@alexvan.camp>",
    "Matt McNamara <matt@mattmcn.com>",
    "Anthony Oetzmann <aironaudio@googlemail.com>",
    "Atmo <brian@doublejump.eu>"
  ],
  "resolutions": [
    "720p"
  ],
  "license": "MIT",
  "extension": {
    "express": false,
    "path": "index.js"
  },
  "bundleDependencies": [
    "some-bundle",
    "another-bundle"
  ]
}
```
