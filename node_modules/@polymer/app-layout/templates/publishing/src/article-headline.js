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
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';

import {html} from '@polymer/polymer/lib/utils/html-tag.js';
Polymer({
  _template: html`
    <style>

      :host {
        font-size: 22px;
        line-height: 32px;
      }

      a {
        @apply --layout-vertical;
        height: 100%;
        text-decoration: none;
      }

      .image {
        @apply --layout-flex;
        background-repeat: no-repeat;
        background-position: center center;
        background-size: contain;
      }

      .title {
        height: 56px;
        @apply --layout-horizontal;
        @apply --layout-center-center;
        padding: 0 8px;
        text-align: center;
        letter-spacing: 0.8px;
        color: #fff;
      }

    </style>

    <a href\$="[[href]]">
      <div class="image" style\$="background-color: [[article.primaryColor]]; background-image: url('[[article.image]]');"></div>
      <div class="title" style\$="background-color: [[article.secondaryColor]];">[[article.title]]</div>
    </a>
`,

  is: 'article-headline',

  properties: {

    article: Object,

    href: String

  }
});
