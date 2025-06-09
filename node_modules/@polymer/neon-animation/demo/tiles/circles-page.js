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

import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {dom} from '@polymer/polymer/lib/legacy/polymer.dom.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import {NeonSharedElementAnimatableBehavior} from '../../neon-shared-element-animatable-behavior.js';

Polymer({
  _template: html`
    <style>
      :host {
        @apply --layout-horizontal;
        @apply --layout-center-center;
      }

      .circle {
        display: inline-block;
        box-sizing: border-box;
        width: 100px;
        height: 100px;
        margin: 16px;
        border-radius: 50%;
        background: var(--color-one);
      }
    </style>

    <div>
      <div class="circle"></div>
      <div class="circle"></div>
      <div class="circle"></div>
      <div class="circle"></div>
    </div>
  `,

  is: 'circles-page',
  behaviors: [NeonSharedElementAnimatableBehavior],

  properties: {

    animationConfig: {type: Object}
  },

  listeners: {'click': '_onClick'},

  attached: function() {
    if (this.animationConfig) {
      return;
    }

    var circles = dom(this.root).querySelectorAll('.circle');
    var circlesArray = Array.from(circles);
    this.animationConfig = {
      'entry': [{
        name: 'cascaded-animation',
        animation: 'scale-up-animation',
        nodes: circlesArray,
      }],

      'exit': [
        {
          name: 'hero-animation',
          id: 'hero',
          fromPage: this,
        },
        {
          name: 'cascaded-animation',
          animation: 'scale-down-animation',
        }
      ]
    };
  },

  _onClick: function(event) {
    var target = dom(event).rootTarget;

    if (target.classList.contains('circle')) {
      // configure the page animation
      this.sharedElements = {'hero': target};

      var nodesToScale = [];
      var circles = dom(this.root).querySelectorAll('.circle');

      for (var node, index = 0; node = circles[index]; index++) {
        if (node !== event.target) {
          nodesToScale.push(node);
        }
      }

      this.animationConfig['exit'][1].nodes = nodesToScale;
      this.fire('circle-click');
    }
  }
});
