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
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@polymer/paper-styles/shadow.js';
import './animated-grid.js';

import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import {NeonAnimatableBehavior} from '../../neon-animatable-behavior.js';
import {NeonAnimationRunnerBehavior} from '../../neon-animation-runner-behavior.js';

Polymer({
  _template: html`
    <style>
      :host {
        background: black;
        visibility: hidden;
        @apply --layout-vertical;
      }

      .toolbar {
        background: #9c27b0;
        height: 72px;
        z-index: 1;
        @apply --shadow-elevation-2dp;
      }

      animated-grid {
        height: calc(100% - 72px);
        @apply --layout-flex;
      }
    </style>

    <div id="toolbar" class="toolbar"></div>
    <animated-grid id="grid"></animated-grid>
  `,

  is: 'full-page',

  behaviors: [NeonAnimatableBehavior, NeonAnimationRunnerBehavior],

  properties: {

    animationConfig: {type: Object}
  },

  attached: function() {
    this.animationConfig = this.animationConfig || {
      'entry': [
        {
          name: 'slide-from-top-animation',
          node: this.$.toolbar,
        },
        {
          animatable: this.$.grid,
          type: 'entry',
        }
      ]
    };
  },

  show: function() {
    this.style.visibility = 'visible';
    this.playAnimation('entry');
  }
});
