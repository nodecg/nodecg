/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
import '@polymer/polymer/polymer-legacy.js';

import {IronCheckedElementBehavior, IronCheckedElementBehaviorImpl} from '@polymer/iron-checked-element-behavior/iron-checked-element-behavior.js';

import {PaperInkyFocusBehavior} from './paper-inky-focus-behavior.js';
import {PaperRippleBehavior} from './paper-ripple-behavior.js';

/**
 * Use `PaperCheckedElementBehavior` to implement a custom element that has a
 * `checked` property similar to `IronCheckedElementBehavior` and is compatible
 * with having a ripple effect.
 * @polymerBehavior PaperCheckedElementBehavior
 */
export const PaperCheckedElementBehaviorImpl = {
  /**
   * Synchronizes the element's checked state with its ripple effect.
   */
  _checkedChanged: function() {
    IronCheckedElementBehaviorImpl._checkedChanged.call(this);
    if (this.hasRipple()) {
      if (this.checked) {
        this._ripple.setAttribute('checked', '');
      } else {
        this._ripple.removeAttribute('checked');
      }
    }
  },

  /**
   * Synchronizes the element's `active` and `checked` state.
   */
  _buttonStateChanged: function() {
    PaperRippleBehavior._buttonStateChanged.call(this);
    if (this.disabled) {
      return;
    }
    if (this.isAttached) {
      this.checked = this.active;
    }
  }
};

/** @polymerBehavior */
export const PaperCheckedElementBehavior = [
  PaperInkyFocusBehavior,
  IronCheckedElementBehavior,
  PaperCheckedElementBehaviorImpl
];
