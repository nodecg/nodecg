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
import './waterfall.js';
import './resize-title.js';
import './blend-background.js';
import './parallax-background.js';

import {ElementWithBackground, registerEffect} from '../../helpers/helpers.js';

/**
 * Shorthand for the waterfall, resize-title, blend-background, and
 * parallax-background effects.
 */
registerEffect('material', {
  /** @this {Material} */
  setUp: function setUp() {
    this.effects =
        'waterfall resize-title blend-background parallax-background';
    return false;
  }
});

/**
 * @interface
 * @extends {ElementWithBackground}
 */
class Material {
  constructor() {
    /** @type {string} */
    this.effects;
  }
}
