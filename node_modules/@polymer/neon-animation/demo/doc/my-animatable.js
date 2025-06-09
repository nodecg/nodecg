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
import '../../animations/scale-down-animation.js';

import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import {NeonAnimationRunnerBehavior} from '../../neon-animation-runner-behavior.js';

Polymer({
  _template: html`
    <style>
      :host {
        display: inline-block;
        border-radius: 50%;
        width: 300px;
        height: 300px;
        background: orange;
      }
    </style>
    <slot></slot>
  `,

  is: 'my-animatable',
  behaviors: [NeonAnimationRunnerBehavior],

  properties: {

    animationConfig: {
      type: Object,
      value: function() {
        return {
          name: 'scale-down-animation', node: this
        }
      }
    }

  },

  listeners: {'neon-animation-finish': '_onNeonAnimationFinish'},

  animate: function() {
    this.playAnimation();
  },

  _onNeonAnimationFinish: function() {
    console.log('animation finish!');
  }
});
