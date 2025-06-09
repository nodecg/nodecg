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

/**
 * While scrolling down, fade in the rear background layer and fade out the
 * front background layer (opacity interpolated based on scroll position).
 */
registerEffect('blend-background', {
  /** @this {BlendBackground} */
  setUp: function setUp() {
    var fx = {};
    fx.backgroundFrontLayer = this._getDOMRef('backgroundFrontLayer');
    fx.backgroundRearLayer = this._getDOMRef('backgroundRearLayer');
    fx.backgroundFrontLayer.style.willChange = 'opacity';
    fx.backgroundFrontLayer.style.transform = 'translateZ(0)';
    fx.backgroundRearLayer.style.willChange = 'opacity';
    fx.backgroundRearLayer.style.transform = 'translateZ(0)';
    fx.backgroundRearLayer.style.opacity = 0;
    this._fxBlendBackground = fx;
  },
  /** @this {BlendBackground} */
  run: function run(p, y) {
    var fx = this._fxBlendBackground;
    fx.backgroundFrontLayer.style.opacity = 1 - p;
    fx.backgroundRearLayer.style.opacity = p;
  },
  /** @this {BlendBackground} */
  tearDown: function tearDown() {
    delete this._fxBlendBackground;
  }
});

/**
 * @interface
 * @extends {ElementWithBackground}
 */
class BlendBackground {
  constructor() {
    /**
     * @typedef {{
     *   backgroundFrontLayer: !HTMLElement,
     *   backgroundRearLayer: !HTMLElement,
     * }}
     */
    this._fxBlendBackground;
  }
}
