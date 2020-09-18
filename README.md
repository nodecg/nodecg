# NodeCG

[![NodeCG](https://raw.githubusercontent.com/nodecg/nodecg/master/media/splash.png)](https://nodecg.dev/)

[![Discord](https://img.shields.io/discord/754749209722486814.svg?logo=discord)](https://discord.com/invite/GJ4r8a8)
[![Build Status](https://github.com/nodecg/nodecg/workflows/CI/badge.svg?branch=legacy-1.x)](https://github.com/nodecg/nodecg/actions?query=workflow%3ACI)
[![Coverage Status](https://codecov.io/gh/nodecg/nodecg/branch/master/graph/badge.svg)](https://codecov.io/gh/nodecg/nodecg)
[![Docker Build Status](https://img.shields.io/docker/build/nodecg/nodecg.svg)](https://hub.docker.com/r/nodecg/nodecg/tags/)
[![Twitter](https://img.shields.io/twitter/url/https/twitter.com/fold_left.svg?style=social&label=Follow%20%40NodeCG)](https://twitter.com/NodeCG)

NodeCG is a broadcast graphics framework and application. It enables you to write complex, dynamic broadcast graphics
using the web platform. NodeCG has no graphics or drawing primitives of its own. Instead, NodeCG provides
a structure for your code and an API to facilitate moving data between the dashboard, the server, and your graphics.
It makes no assumptions about how to best code a graphic, and gives you complete freedom to use whatever libraries,
frameworks, tools, and methodologies you want. As such, NodeCG graphics can be rendered in any environment that
can render HTML, including:

- [OBS Studio](https://obsproject.com/)
- [vMix](http://www.vmix.com/)
- [XSplit](https://www.xsplit.com/)
- [CasparCG](https://github.com/CasparCG/server/releases) (v2.2.0+)

> Don't see your preferred streaming software on this list? NodeCG graphics require Chrome 49 or newer. If your streaming software's implementation of browser source uses a build of CEF that is based on at least Chrome 49, chances are that NodeCG graphics will work in it. You can check what version of Chrome your streaming software uses for its browser sources by opening [whatversion.net/chrome](http://www.whatversion.net/chrome) as a browser source.

Have questions about NodeCG, or just want to say 'hi'? [Join our Discord server](https://discord.com/invite/GJ4r8a8)!

## Documentation & API Reference

Full docs and API reference are available at https://nodecg.dev

## Goals

The NodeCG project exists to accomplish the following goals:

- Make broadcast graphics (also known as "character generation" or "CG") more accessible.
- Remain as close to the web platform as possible.
- Support broadcasts of any size and ambition.

Let's unpack what these statements mean:

### > Make broadcast graphics (also known as "character generation" or "CG") more accessible

Historically, broadcast graphics have been expensive. They either required expensive hardware, expensive software, or both. NodeCG was originally created to provide real-time broadcast graphics for Tip of the Hats, which is an all-volunteer charity fundraiser that had a budget of \$0 for its first several years.

Now, it is possible to create an ambitious broadcast using entirely free software and consumer hardware. The NodeCG project embraces this democratization of broadcast technology.

### > Remain as close to the web platform as possible

NodeCG graphics are just webpages. There is absolutely nothing special or unique about them. This is their greatest strength.

By building on the web platform, and not building too many abstractions on top of it, people developing broadcast graphics with NodeCG have access to the raw potential of the web. New APIs and capabilities are continually being added to the web platform, and NodeCG developers should have access to the entirety of what the web can offer.

### > Support broadcasts of any size and ambition

NodeCG's roots are in small broadcasts with no budget. More recently, NodeCG has begun seeing use in increasingly elaborate productions. We believe that one set of tools can and should be able to scale up from the smallest show all the way to the biggest fathomable show. Whether you're using OBS for everything, or a hardware switcher with a traditional key/fill workflow, NodeCG can be a part of any broadcast graphics system.

## Maintainers

- [Alex "Lange" Van Camp](https://alexvan.camp)
- [Matt "Bluee" McNamara](https://mattmcn.com/)
- [Keiichiro "Hoishin" Amemiya](https://hoish.in/)

## Designers

- [Chris Hanel](http://www.chrishanel.com)

## Acknowledgements

- [Atmo](https://github.com/atmosfar), original dashboard concept and code, the inspiration for toth-overlay
- [Alex "Lange" Van Camp](http://alexvan.camp), designer & developer of [toth-overlay](https://github.com/TipoftheHats/toth-overlay), the base on which NodeCG was built
