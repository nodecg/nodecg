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
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-item/paper-item-body.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/paper-styles/color.js';

import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {dom} from '@polymer/polymer/lib/legacy/polymer.dom.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

import {NeonAnimatableBehavior} from '../../neon-animatable-behavior.js';

Polymer({
  _template: html`
    <style>
      :host {
        @apply --layout-vertical;
      }

      .main {
        @apply --layout-flex;
        @apply --layout-scroll;
      }

      iron-icon {
        color: var(--google-grey-500);
      }

      app-toolbar {
        color: white;
        background-color: var(--google-blue-500);
      }
    </style>
    <app-toolbar>
      <paper-icon-button id="button" icon="arrow-back"></paper-icon-button>
    </app-toolbar>

    <div class="main">

        <template is="dom-repeat" items="[[data]]">

          <paper-item>
            <paper-item-body two-line>
              <div>[[item.fileName]]</div>
              <div secondary>[[item.modifiedDate]]</div>
            </paper-item-body>
            <iron-icon icon="info"></iron-icon>
          </paper-item>

        </template>

    </div>
  `,

  is: 'list-view',
  behaviors: [NeonAnimatableBehavior],
  listeners: {'click': '_onClick'},

  properties: {

    data: {
      type: Array,
      value: function() {
        return [];
      }
    },

    animationConfig: {type: Object}
  },

  attached: function() {
    if (this.animationConfig) {
      return;
    }

    this.animationConfig = {
      'entry': [{name: 'fade-in-animation', node: this.$.button}],

      'exit': [
        {name: 'fade-out-animation', node: this.$.button},
        {name: 'hero-animation', id: 'hero', fromPage: this}
      ]
    };
  },

  _onClick: function(event) {
    var target = dom(event).rootTarget;

    // configure the page animation
    this.sharedElements = {
      'hero': target,
    };

    this.fire('item-click', {
      item: target,
    });
  }
});
