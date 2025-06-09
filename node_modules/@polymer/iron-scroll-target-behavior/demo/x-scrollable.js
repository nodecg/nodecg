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

import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import {IronScrollTargetBehavior} from '../iron-scroll-target-behavior.js';

Polymer({
  _template: html`
    <style>
      :host {
        display: block;
        font: 14px arial;
      }

      .scrollState {
        border-left: 1px solid #ccc;
        border-right: 1px solid #ccc;
        border-bottom: 1px solid #ccc;
        font-weight: bold;
        background-color: #eee;
        position: fixed;
        top: 0;
        left: calc(50% - 100px);
        padding: 10px;
        width: 220px;
        text-align: center;
      }

      .item {
        border-bottom: 1px solid #ccc;
        background-color: white;
        padding: 20px;
        width: 200%;
      }

    </style>
    <div class="scrollState">scrollTop: [[xScrollTop]] - scrollLeft: [[xScrollLeft]]</div>
    <template is="dom-repeat" items="[[_getItems(itemCount)]]">
      <div class="item">[[index]]</div>
    </template>
`,

  is: 'x-scrollable',

  properties: {

    xScrollTop: {type: Number, readOnly: true, value: 0},

    xScrollLeft: {type: Number, readOnly: true, value: 0},

    itemCount: {type: Number, value: 200}

  },

  behaviors: [IronScrollTargetBehavior],

  attached: function() {
    this._scrollHandler();
  },

  _scrollHandler: function() {
    this._setXScrollTop(this._scrollTop);
    this._setXScrollLeft(this._scrollLeft);
  },

  _getItems: function(itemCount) {
    var items = new Array(itemCount);
    while (itemCount > 0) {
      items[--itemCount] = true;
    }
    return items;
  }
});
