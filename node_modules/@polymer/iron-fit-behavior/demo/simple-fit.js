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

import {IronFitBehavior} from '../iron-fit-behavior.js';

Polymer({
  _template: html`
    <style>
      :host {
        background-color: var(--paper-light-blue-500);
        color: white;
        text-align: center;
      }
    </style>
    <slot></slot>
`,

  is: 'simple-fit',
  behaviors: [IronFitBehavior]
});
