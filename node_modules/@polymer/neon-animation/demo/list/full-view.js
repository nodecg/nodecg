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
import '@polymer/app-layout/app-toolbar/app-toolbar.js';

import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import {NeonAnimatableBehavior} from '../../neon-animatable-behavior.js';

Polymer({
  _template: html`
    <style>
      :host {
        @apply --layout-vertical;
      }

      .main {
        background: white;
        @apply --layout-flex;
        @apply --layout-scroll;
        @apply --shadow-elevation-8dp;
      }

      .image-container {
        position: relative;
        width: 100%;
        padding-bottom: 100%;
      }

      .image {
        position: absolute;
        width: 100%;
        height: 100%;
        background: repeating-linear-gradient(
          45deg,
          #f5f5f5,
          #f5f5f5 8px,
          #e0e0e0 8px,
          #e0e0e0 16px
        );
      }

      app-toolbar {
        color: white;
        background-color: var(--google-blue-500);
      }
    </style>
    <app-toolbar>
      <paper-icon-button id="button" icon="clear" on-click="_onClearButtonClick"></paper-icon-button>
    </app-toolbar>

    <div id="main" class="main">
      <div class="image-container">
        <div class="image">
        </div>
      </div>
    </div>
  `,

  is: 'full-view',
  behaviors: [NeonAnimatableBehavior],

  properties: {

    sharedElements: {type: Object},

    animationConfig: {type: Object}
  },

  attached: function() {
    if (this.animationConfig) {
      return;
    }

    this.sharedElements = {'hero': this.$.main};
    this.animationConfig = {
      'entry': [
        {name: 'fade-in-animation', node: this.$.button},
        {name: 'hero-animation', id: 'hero', toPage: this}
      ],

      'exit': [
        {name: 'fade-out-animation', node: this.$.button},
        {
          name: 'scale-down-animation',
          node: this.$.main,
          transformOrigin: '50% 50%',
          axis: 'y'
        }
      ]
    }
  },

  _onClearButtonClick: function() {
    this.fire('close');
  }
});
