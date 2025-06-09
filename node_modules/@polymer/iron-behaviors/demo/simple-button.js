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

import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import {IronButtonState} from '../iron-button-state.js';
import {IronControlState} from '../iron-control-state.js';

Polymer({
  _template: html`
    <style>
      :host {
        display: inline-block;
        background-color: #4285F4;
        color: #fff;
        min-height: 8px;
        min-width: 8px;
        padding: 16px;
        text-transform: uppercase;
        border-radius: 3px;
        -moz-user-select: none;
        -ms-user-select: none;
        -webkit-user-select: none;
        user-select: none;
        cursor: pointer;
      }

      :host([disabled]) {
        opacity: 0.3;
        pointer-events: none;
      }

      :host([active]),
      :host([pressed]) {
        background-color: #3367D6;
        box-shadow: inset 0 3px 5px rgba(0,0,0,.2);
      }

      :host([focused]) {
        box-shadow: 0 16px 24px 2px rgba(0, 0, 0, 0.14),
                    0  6px 30px 5px rgba(0, 0, 0, 0.12),
                    0  8px 10px -5px rgba(0, 0, 0, 0.4);
      }
    </style>

    <slot></slot>
`,

  is: 'simple-button',
  behaviors: [IronControlState, IronButtonState],
  hostAttributes: {role: 'button'}
});
