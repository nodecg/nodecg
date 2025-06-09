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
import '@polymer/iron-input/iron-input.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import './ssn-validator.js';

import {IronValidatableBehavior} from '@polymer/iron-validatable-behavior/iron-validatable-behavior.js';
import {DomModule} from '@polymer/polymer/lib/elements/dom-module.js';
import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';
import {PolymerElement} from '@polymer/polymer/polymer-element.js';

Polymer({
  is: 'ssn-input',
  _template: html`
    <style>
      :host {
        display: inline-block;
      }

      :host([hidden]) {
        display: none !important;
      }

      input {
        font: inherit;
        outline: none;
        box-shadow: none;
        border: none;
        width: auto;
        text-align: center;
      }

      .container {
        @apply --layout-horizontal;
      }
    </style>

    <ssn-validator></ssn-validator>
    <div class="container">
      <iron-input bind-value="{{_ssn1}}" aria-label="First 3 digits of social security number">
        <input maxlength="3" size="3">
      </iron-input>
      -
      <iron-input bind-value="{{_ssn2}}" aria-label="Middle 2 digits of social security number">
        <input maxlength="2" size="2">
      </iron-input>
      -
      <iron-input bind-value="{{_ssn3}}" aria-label="Last 4 digits of social security number">
        <input maxlength="4" size="4">
      </iron-input>
    </div>
  `,
  behaviors: [IronValidatableBehavior],

  properties: {
    value: {notify: true, type: String},

    _ssn1: {type: String, value: ''},

    _ssn2: {type: String, value: ''},

    _ssn3: {type: String, value: ''},

    validator: {type: String, value: 'ssn-validator'}
  },

  observers: ['_computeValue(_ssn1,_ssn2,_ssn3)'],

  _computeValue: function(ssn1, ssn2, ssn3) {
    this.value = ssn1.trim() + '-' + ssn2.trim() + '-' + ssn3.trim();
  }
});
