/**
@license
Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
import '@polymer/polymer/polymer-legacy.js';

import '@polymer/paper-card/paper-card.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';
Polymer({
  _template: html`
    <style>
      :host {
        @apply --layout-horizontal;
        @apply --layout-center-center;
        @apply --layout-wrap;
      }

      a {
        color: black;
        text-decoration: none;
      }

      paper-card {
        width: 300px;
        margin: 1em 0.5em 0em;
        font-size: 14px;
      }

      .card-content {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    </style>
    <template is="dom-repeat" items="{{items}}" as="video">
      <!-- The '#' is included because the use-hash-as-path property is
      set to true in the app-location -->
      <a href="./#/video/{{video.id}}">
        <paper-card image="{{video.thumbnail}}">
          <div class="card-content">
            {{video.title}}
          </div>
        </paper-card>
      </a>
    </template>
`,

  is: 'search-results',
  properties: {items: {type: Array}}
})
