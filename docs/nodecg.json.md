#Schema
##Name
A string. The name of your package, must be unique. No two packages with identical names may be installed at the same time.

##Version
A string. The version of your package.

##Description
A string. A brief description of what this package is and does.

##Homepage
A string. A link to the homepage or repository of this package.

##Authors
A array of strings. The authors of this package.

##Resolutions
An array of strings. Most packages will only run at a single resolution. Currently used only for informational displays to the end user. Values should be stated as "720p", "1080p", "1440p", etc.

##License
A string. The license used by your package (i.e., MIT, GPLv3).

#Example
```json
{
  "name": "toth-alert",
  "version": "0.0.1",
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
  "license": "MIT"
}
```