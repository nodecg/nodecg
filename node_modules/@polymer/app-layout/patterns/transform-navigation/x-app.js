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
import '../../app-drawer-layout/app-drawer-layout.js';

import '../../app-drawer/app-drawer.js';
import '../../app-header/app-header.js';
import '../../app-header-layout/app-header-layout.js';
import '../../app-toolbar/app-toolbar.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-media-query/iron-media-query.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/paper-tabs/paper-tabs.js';
import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';
Polymer({
  _template: html`
    <style>

      app-toolbar {
        background-color: #dcdcdc;
      }

      .main-header {
        box-shadow: 0px 5px 6px -3px rgba(0, 0, 0, 0.4);
      }

      paper-tabs {
        --paper-tabs-selection-bar-color: black;
        height: 100%;
        max-width: 640px;
      }

      paper-tab {
        --paper-tab-ink: #aaa;
        text-transform: uppercase;
      }

      [hidden] {
        display: none !important;
      }

    </style>

    <app-drawer-layout force-narrow>

      <app-drawer id="drawer" slot="drawer">

        <app-toolbar></app-toolbar>

        <!-- Nav on mobile: side nav menu -->
        <paper-listbox selected="{{selected}}" attr-for-selected="name">
          <template is="dom-repeat" items="{{items}}">
            <paper-item name\$="{{item}}">{{item}}</paper-item>
          </template>
        </paper-listbox>

      </app-drawer>

      <app-header-layout>
        <app-header class="main-header" slot="header">

          <app-toolbar>
            <paper-icon-button class="menu-button" icon="menu" drawer-toggle hidden\$="{{wideLayout}}"></paper-icon-button>
          </app-toolbar>

          <app-toolbar class="tabs-bar" hidden\$="{{!wideLayout}}">
            <!-- Nav on desktop: tabs -->
            <paper-tabs selected="{{selected}}" attr-for-selected="name">
              <template is="dom-repeat" items="{{items}}">
                <paper-tab name\$="{{item}}">{{item}}</paper-tab>
              </template>
            </paper-tabs>
          </app-toolbar>

        </app-header>
      </app-header-layout>

    </app-drawer-layout>

    <iron-media-query query="min-width: 600px" query-matches="{{wideLayout}}"></iron-media-query>
`,

  is: 'x-app',

  properties: {

    selected: {type: String, value: 'Item One'},

    wideLayout: {
      type: Boolean,
      value: false,
      observer: 'onLayoutChange',
    },

    items: {
      type: Array,
      value: function() {
        return ['Item One', 'Item Two', 'Item Three', 'Item Four', 'Item Five'];
      }
    }
  },

  onLayoutChange: function(wide) {
    var drawer = this.$.drawer;

    if (wide && drawer.opened) {
      drawer.opened = false;
    }
  }
});
