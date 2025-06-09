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
import '@polymer/paper-styles/shadow.js';

import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import {NeonAnimationRunnerBehavior} from '../../neon-animation-runner-behavior.js';

Polymer({
  _template: html`
    <style>
      :host {
        display: none;
        padding: 16px;
        background: white;
        color: black;

        @apply --shadow-elevation-2dp;
      }
    </style>
    <slot></slot>
  `,

  is: 'animated-dropdown',
  behaviors: [NeonAnimationRunnerBehavior],

  properties: {

    animationConfig: {
      type: Object,
      value: function() {
        return {
          'entry': [{
            name: 'scale-up-animation',
            node: this,
            transformOrigin: '0 0',
          }],
          'exit': [{name: 'fade-out-animation', node: this}],
        };
      }
    },

    _showing: {type: Boolean, value: false}

  },

  listeners: {'neon-animation-finish': '_onAnimationFinish'},

  _onAnimationFinish: function() {
    if (this._showing) {
    } else {
      this.style.display = '';
    }
  },

  show: function() {
    this.style.display = 'inline-block';
    this._showing = true;
    this.playAnimation('entry');
  },

  hide: function() {
    this._showing = false;
    this.playAnimation('exit');
  }
});
