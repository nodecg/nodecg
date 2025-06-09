/**
@license
Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
import '../app-scroll-effects-behavior.js';

import {ElementWithBackground, registerEffect} from '../../helpers/helpers.js';

function interpolate(progress, points, fn, ctx) {
  fn.apply(ctx, points.map(function(point) {
    return point[0] + (point[1] - point[0]) * progress;
  }));
}

/**
 * Transform the font size of a designated title element between two values
 * based on the scroll position.
 */
registerEffect('resize-title', {
  /** @this {ResizeTitle} */
  setUp: function setUp() {
    var title = this._getDOMRef('mainTitle');
    var condensedTitle = this._getDOMRef('condensedTitle');

    if (!condensedTitle) {
      console.warn('Scroll effect `resize-title`: undefined `condensed-title`');
      return false;
    }
    if (!title) {
      console.warn('Scroll effect `resize-title`: undefined `main-title`');
      return false;
    }

    condensedTitle.style.willChange = 'opacity';
    condensedTitle.style.webkitTransform = 'translateZ(0)';
    condensedTitle.style.transform = 'translateZ(0)';
    condensedTitle.style.webkitTransformOrigin = 'left top';
    condensedTitle.style.transformOrigin = 'left top';

    title.style.willChange = 'opacity';
    title.style.webkitTransformOrigin = 'left top';
    title.style.transformOrigin = 'left top';
    title.style.webkitTransform = 'translateZ(0)';
    title.style.transform = 'translateZ(0)';

    var titleClientRect = title.getBoundingClientRect();
    var condensedTitleClientRect = condensedTitle.getBoundingClientRect();
    var fx = {};

    fx.scale =
        parseInt(window.getComputedStyle(condensedTitle)['font-size'], 10) /
        parseInt(window.getComputedStyle(title)['font-size'], 10);
    fx.titleDX = titleClientRect.left - condensedTitleClientRect.left;
    fx.titleDY = titleClientRect.top - condensedTitleClientRect.top;
    fx.condensedTitle = condensedTitle;
    fx.title = title;

    this._fxResizeTitle = fx;
  },
  /** @this {ResizeTitle} */
  run: function run(p, y) {
    var fx = this._fxResizeTitle;
    if (!this.condenses) {
      y = 0;
    }
    if (p >= 1) {
      fx.title.style.opacity = 0;
      fx.condensedTitle.style.opacity = 1;
    } else {
      fx.title.style.opacity = 1;
      fx.condensedTitle.style.opacity = 0;
    }
    interpolate(
        Math.min(1, p),
        [[1, fx.scale], [0, -fx.titleDX], [y, y - fx.titleDY]],
        function(scale, translateX, translateY) {
          this.transform(
              'translate(' + translateX + 'px, ' + translateY + 'px) ' +
                  'scale3d(' + scale + ', ' + scale + ', 1)',
              fx.title);
        },
        this);
  },
  /** @this {ResizeTitle} */
  tearDown: function tearDown() {
    delete this._fxResizeTitle;
  }
});

/**
 * @interface
 * @extends {ElementWithBackground}
 */
class ResizeTitle {
  constructor() {
    /** @type {boolean} */
    this.condenses;

    /**
     * @typedef {{
     *   title: !HTMLElement,
     *   condensedTitle: !HTMLElement,
     *   scale: number,
     *   titleDX: number,
     *   titleDY: number,
     * }}
     */
    this._fxResizeTitle;
  }
}
