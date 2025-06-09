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
import '../../animations/scale-up-animation.js';
import '../../animations/fade-out-animation.js';

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
        margin: 0 auto;
        z-index: 100;
        position: absolute;
        @apply --shadow-elevation-2dp;
      }
    </style>
    <slot></slot>
  `,

  is: 'my-dialog',
  behaviors: [NeonAnimationRunnerBehavior],

  properties: {

    opened: {type: Boolean},

    animationConfig: {
      type: Object,
      value: function() {
        return {
          'entry': [{name: 'scale-up-animation', node: this}],
              'exit': [{name: 'fade-out-animation', node: this}]
        }
      }
    }

  },

  listeners: {'neon-animation-finish': '_onAnimationFinish'},

  _onAnimationFinish: function() {
    if (!this.opened) {
      this.style.display = '';
    }
  },

  show: function() {
    this.opened = true;
    this.style.display = 'inline-block';
    this.playAnimation('entry');
  },

  hide: function() {
    this.opened = false;
    this.playAnimation('exit');
  }
});
