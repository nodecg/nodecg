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
import '../shared-styles.js';

import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import {NeonSharedElementAnimatableBehavior} from '../../neon-shared-element-animatable-behavior.js';

Polymer({
  _template: html`
    <style include="shared-styles"></style>
    <style>

      :host {
        display: block;
      }

      .fixed {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 100vw;
      }

      .card {
        position: relative;
        margin: 15vh 15vw 0;
        width: 70vw;
        height: 70vh;
      }

    </style>

    <div id="fixed" class$="[[_computeFixedBackgroundClass(color)]]"></div>
    <div id="card" class$="[[_computeCardClass(color)]]"></div>
  `,

  is: 'fullsize-page-with-card',
  behaviors: [NeonSharedElementAnimatableBehavior],

  properties: {

    color: {type: String},

    sharedElements: {type: Object},

    animationConfig: {type: Object}
  },

  attached: function() {
    if (this.animationConfig) {
      return;
    }

    this.sharedElements = {
      'hero': this.$.card,
      'ripple': this.$.fixed,
    };

    this.animationConfig = {
      'entry': [
        {
          name: 'ripple-animation',
          id: 'ripple',
          toPage: this,
        },
        {
          name: 'hero-animation',
          id: 'hero',
          toPage: this,
          timing: {delay: 150},
        },
      ],
      'exit': [
        {
          name: 'fade-out-animation',
          node: this.$.fixed,
        },
        {
          name: 'transform-animation',
          transformFrom: 'none',
          transformTo: 'translate(0px,-200vh) scale(0.9,1)',
          node: this.$.card,
        },
      ]
    };
  },

  _computeCardClass: function(color) {
    var cls = 'card';
    if (color) {
      cls += ' ' + color + '-300';
    }
    return cls;
  },

  _computeFixedBackgroundClass: function(color) {
    var cls = 'fixed';
    if (color) {
      cls += ' ' + color + '-100';
    }
    return cls;
  }
});
