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
import '@polymer/iron-icon/iron-icon.js';

import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-fab/paper-fab.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-item/paper-icon-item.js';
import '@polymer/paper-menu-button/paper-menu-button.js';

import '@polymer/app-layout/app-header-layout/app-header-layout.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-scroll-effects/app-scroll-effects.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';

import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';

import {html} from '@polymer/polymer/lib/utils/html-tag.js';
Polymer({
  _template: html`
    <style>

    :host {
      display: block;
      background-attachment: fixed;
      background-size: 100% auto;
      background-repeat: no-repeat;
    }

    #header {
      color: white;

      --app-header-background-rear-layer: {
        background-color: #00AA8D;
      };
    }

    paper-icon-button {
      color: white;
      --paper-icon-button-ink-color: white;
    }

    .card-container {
      position: relative;
      width: 720px;
      margin: 300px auto 40px;
    }

    paper-fab {
      position: absolute;
      top: -28px;
      right: 40px;

      --paper-fab-background: #EF5458;
      --paper-fab-keyboard-focus-background: #DF4448;
    }

    paper-card {
      padding: 16px 0 16px 100px;
      width: 100%;
      sizing: border-box;
    }

    paper-card p {
      margin: 12px 0;
      color: #999;
    }

    h4 {
      margin: 60px 0 12px;
    }

    .ingredient-item {
      margin: 20px 0;
      @apply --layout-horizontal;
    }

    .ingredient-amount {
      margin-left: -80px;
      width: 60px;
      padding-right: 20px;
      color: rgb(33, 169, 143);
      text-align: right;
    }

    .ingredient-name {
      @apply --layout-flex;
    }

    @media (max-width: 720px) {

      .card-container {
        width: 100%;
        margin: 150px 0 0;
      }

    }

    </style>

    <!-- main panel -->
    <app-header-layout>

      <app-header id="header" effects="waterfall fade-background" reveals slot="header">

        <!-- top toolbar -->
        <app-toolbar>
          <!-- back button -->
          <a href="#/home" tabindex="-1">
            <paper-icon-button icon="app:arrow-back"></paper-icon-button>
          </a>

          <div main-title></div>

          <paper-menu-button horizontal-align="right">
            <paper-icon-button icon="app:more-vert" slot="dropdown-trigger" alt="menu"></paper-icon-button>
            <paper-listbox slot="dropdown-content">
              <paper-icon-item>
                <iron-icon icon="app:share" slot="item-icon"></iron-icon>
                Tweet recipe
              </paper-icon-item>
              <paper-icon-item>
                <iron-icon icon="app:email" slot="item-icon"></iron-icon>
                Email recipe
              </paper-icon-item>
              <paper-icon-item>
                <iron-icon icon="app:textsms" slot="item-icon"></iron-icon>
                Message recipe
              </paper-icon-item>
              <paper-icon-item>
                <iron-icon icon="app:group" slot="item-icon"></iron-icon>
                Share on Facebook
              </paper-icon-item>
            </paper-listbox>
          </paper-menu-button>
        </app-toolbar>

      </app-header>

      <div class="card-container">

        <paper-card heading="{{recipe.name}}">
          <div class="card-content">

            <p>{{recipe.description}}</p>

            <h4>Ingredients</h4>

            <template is="dom-repeat" items="{{recipe.ingredients}}">
              <div class="ingredient-item">
                <div class="ingredient-amount">{{item.amount}}</div>
                <div class="ingredient-name">{{item.description}}</div>
              </div>
            </template>

            <h4>Steps</h4>

            <template is="dom-repeat" items="{{recipe.steps}}">
              <div class="ingredient-item">
                <div class="ingredient-amount">{{item.duration}}</div>
                <div class="ingredient-name">{{item.description}}</div>
              </div>
            </template>

          </div>
        </paper-card>

        <paper-fab icon="{{__computeFavIcon(__favorite)}}" on-tap="__toggleFavorite"></paper-fab>
      </div>

    </app-header-layout>
`,

  is: 'recipe-detail',

  properties: {

    recipe: {type: Object, observer: '__recipeChanged'},

    __favorite: {type: Boolean, value: false}

  },

  __recipeChanged: function(recipe) {
    if (recipe) {
      this.style.backgroundImage = 'url(' + recipe.imageUrl + ')';
    }
  },

  __toggleFavorite: function(event, detail) {
    this.__favorite = !this.__favorite;
  },

  __computeFavIcon: function(favorite) {
    return favorite ? 'app:favorite' : 'app:favorite-border';
  }
});
