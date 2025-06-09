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
import '@polymer/polymer/polymer-legacy.js';

import {IronResizableBehavior} from '@polymer/iron-resizable-behavior/iron-resizable-behavior.js';
import {dom} from '@polymer/polymer/lib/legacy/polymer.dom.js';
import {animationFrame} from '@polymer/polymer/lib/utils/async.js';
import {Debouncer} from '@polymer/polymer/lib/utils/debounce.js';
import {enqueueDebouncer} from '@polymer/polymer/lib/utils/flush.js';

/**
 * @polymerBehavior
 */
export const AppLayoutBehavior = [
  IronResizableBehavior,
  {

    listeners: {
      'app-reset-layout': '_appResetLayoutHandler',
      'iron-resize': 'resetLayout'
    },

    attached: function() {
      this.fire('app-reset-layout');
    },

    _appResetLayoutHandler: function(e) {
      if (dom(e).path[0] === this) {
        return;
      }
      this.resetLayout();
      e.stopPropagation();
    },

    _updateLayoutStates: function() {
      console.error('unimplemented');
    },

    /**
     * Resets the layout. If you changed the size of this element via CSS
     * you can notify the changes by either firing the `iron-resize` event
     * or calling `resetLayout` directly.
     *
     * @method resetLayout
     */
    resetLayout: function() {
      var self = this;
      var cb = this._updateLayoutStates.bind(this);
      this._layoutDebouncer =
          Debouncer.debounce(this._layoutDebouncer, animationFrame, cb);
      enqueueDebouncer(this._layoutDebouncer);
      this._notifyDescendantResize();
    },

    _notifyLayoutChanged: function() {
      var self = this;
      // TODO: the event `app-reset-layout` can be fired synchronously
      // as long as `_updateLayoutStates` waits for all the microtasks after
      // rAF. E.g. requestAnimationFrame(setTimeOut())
      requestAnimationFrame(function() {
        self.fire('app-reset-layout');
      });
    },

    _notifyDescendantResize: function() {
      if (!this.isAttached) {
        return;
      }
      this._interestedResizables.forEach(function(resizable) {
        if (this.resizerShouldNotify(resizable)) {
          this._notifyDescendant(resizable);
        }
      }, this);
    }
  }
];
