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
 * Toggles the shadow property in app-header when content is scrolled to create
 * a sense of depth between the element and the content underneath.
 */
registerEffect('waterfall', {
  /** @this {Waterfall} */
  run: function run() {
    this.shadow = this.isOnScreen() && this.isContentBelow();
  }
});

/**
 * @interface
 * @extends {ElementWithBackground}
 */
class Waterfall {
  constructor() {
    /** @type {boolean} */
    this.shadow;
  }
}
