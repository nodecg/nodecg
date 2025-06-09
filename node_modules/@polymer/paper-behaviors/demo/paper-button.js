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
import '@polymer/paper-styles/element-styles/paper-material-styles.js';

import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import {PaperButtonBehavior} from '../paper-button-behavior.js';

Polymer({
  _template: html`
    <style include="paper-material-styles">
      :host {
        display: inline-block;
        position: relative;
        background-color: #4285F4;
        color: #fff;
        border-radius: 3px;
        text-transform: uppercase;
        outline: none;
        -moz-user-select: none;
        -ms-user-select: none;
        -webkit-user-select: none;
        user-select: none;
        cursor: pointer;
      }

      .content {
        border-radius: inherit;
        padding: 16px;
      }

      :host([disabled]) {
        background-color: #888;
        pointer-events: none;
      }

      :host([active]),
      :host([pressed]) {
        background-color: #3367D6;
        box-shadow: inset 0 3px 5px rgba(0,0,0,.2);
      }
    </style>

    <!-- when using paper-material from paper-styles you must add a paper-material class -->
    <div class="content paper-material" elevation\$="[[elevation]]" animated>
      <slot></slot>
    </div>
`,

  is: 'paper-button',
  behaviors: [PaperButtonBehavior]
});
