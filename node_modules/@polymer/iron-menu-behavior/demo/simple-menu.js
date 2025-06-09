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
import '@polymer/paper-styles/color.js';

import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import {IronMenuBehavior} from '../iron-menu-behavior.js';

Polymer({
  _template: html`
    <style>
      :host > ::slotted(*) {
        display: block;
      }

      :host > ::slotted(.iron-selected) {
        color: white;
        background-color: var(--google-blue-500);
      }
    </style>

    <slot></slot>
`,

  is: 'simple-menu',
  behaviors: [IronMenuBehavior]
});
