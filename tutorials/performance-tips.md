## Minimize active `video` tags
For animations that are always the same, pre-rendering them as webm video (which supports alpha transparency)
is an option. However, care must be taken to remove these `video` nodes from the DOM when they are not in use.
Even if a `video` tag is not currently playing, simply having it in the DOM can impact performance.

## Use sprite sheets when appropriate
For short pre-rendered animations, a sprite sheet might be the best solution.
If done right, they can be smaller in size and perform better than their `<video>` counterpart.
There are many libraries and tools out there for sprite sheet creation, but
[EaselJS](http://www.createjs.com/#!/EaselJS) (javascript Canvas2D library) and
[TexturePacker](https://www.codeandweb.com/texturepacker) (sprite sheet creation program) are a good place to start.

## A `<div>` is (generally) faster than a picture or video
Videos and sprite sheets can be nice shortcuts to speed up production time, but if your graphic is
struggling to maintain a solid framerate then you may need to consider breaking it down into smaller parts.
A handful of `<div>`s will generally perform better than a video or sprite sheet, as long as you aren't
applying too many performance-intensive CSS styles.

## Minimize alpha pixels
Alpha (transparency) is expensive to render. Try to keep your images and videos with alpha cropped as much as possible.

## Avoid multiple CSS masks
[CSS masks](http://www.html5rocks.com/en/tutorials/masking/adobe/) have their uses, but layering
multiple masks in a scene can lead to significant performance reductions.
When possible, use a culling `div` with `overflow: hidden` instead.

## Compress your images
Compressed images won't help framerate, but they will improve load times.
Compressing your PNGs with a service such as [TinyPNG](https://tinypng.com/) can result in dramatically
reduced filesizes. Be careful when compressing images with subtle gradients, as some detail may be lost.

## Keep `<canvas>` tags above 256x257 total pixels
In Chrome, `<canvas>` tags are only hardware accelerated when their total size is at least 256x257 pixels.
Below this size, canvases are software rasterized and can severely reduce the framerate and performance of a graphic.

Sources:
[1](https://groups.google.com/a/chromium.org/forum/#!topic/blink-dev/NPSQdiXSK4w) 
[2](https://chromium.googlesource.com/external/Webkit/+/f10c2d38aefd143134545e397bc49c8e305d3ba8/Source/WebCore/page/Settings.cpp#133)

## Be careful which CSS properties you animate
Most CSS properties trigger `layout` events when changed. That means that changing one property can sometimes cause
the entire page to have to be re-rendered, which imposes a significant performance hit. [CSS Triggers](http://csstriggers.com/) is a website
that lets you quickly check which CSS properties are expensive to animate. (Spoilers: `transform` and `opacity` are just about the only
CSS properties that can be freely maniuplated with little overhead).
