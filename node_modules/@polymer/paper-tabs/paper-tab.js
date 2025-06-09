/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
import '@polymer/polymer/polymer-legacy.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';

import {IronButtonState} from '@polymer/iron-behaviors/iron-button-state.js';
import {IronControlState} from '@polymer/iron-behaviors/iron-control-state.js';
import {PaperRippleBehavior} from '@polymer/paper-behaviors/paper-ripple-behavior.js';
import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {dom} from '@polymer/polymer/lib/legacy/polymer.dom.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

/*
`paper-tab` is styled to look like a tab. It should be used in conjunction with
`paper-tabs`.

Example:

    <paper-tabs selected="0">
      <paper-tab>TAB 1</paper-tab>
      <paper-tab>TAB 2</paper-tab>
      <paper-tab>TAB 3</paper-tab>
    </paper-tabs>

### Styling

The following custom properties and mixins are available for styling:

Custom property | Description | Default
----------------|-------------|----------
`--paper-tab-ink` | Ink color | `--paper-yellow-a100`
`--paper-tab` | Mixin applied to the tab | `{}`
`--paper-tab-content` | Mixin applied to the tab content | `{}`
`--paper-tab-content-focused` | Mixin applied to the tab content when the tab is focused | `{}`
`--paper-tab-content-unselected` | Mixin applied to the tab content when the tab is not selected | `{}`

This element applies the mixin `--paper-font-common-base` but does not import
`paper-styles/typography.html`. In order to apply the `Roboto` font to this
element, make sure you've imported `paper-styles/typography.html`.
*/
Polymer({
  _template: html`
    <style>
      :host {
        @apply --layout-inline;
        @apply --layout-center;
        @apply --layout-center-justified;
        @apply --layout-flex-auto;

        position: relative;
        padding: 0 12px;
        overflow: hidden;
        cursor: pointer;
        vertical-align: middle;

        @apply --paper-font-common-base;
        @apply --paper-tab;
      }

      :host(:focus) {
        outline: none;
      }

      :host([link]) {
        padding: 0;
      }

      .tab-content {
        height: 100%;
        transform: translateZ(0);
          -webkit-transform: translateZ(0);
        transition: opacity 0.1s cubic-bezier(0.4, 0.0, 1, 1);
        @apply --layout-horizontal;
        @apply --layout-center-center;
        @apply --layout-flex-auto;
        @apply --paper-tab-content;
      }

      :host(:not(.iron-selected)) > .tab-content {
        opacity: 0.8;

        @apply --paper-tab-content-unselected;
      }

      :host(:focus) .tab-content {
        opacity: 1;
        font-weight: 700;

        @apply --paper-tab-content-focused;
      }

      paper-ripple {
        color: var(--paper-tab-ink, var(--paper-yellow-a100));
      }

      .tab-content > ::slotted(a) {
        @apply --layout-flex-auto;

        height: 100%;
      }
    </style>

    <div class="tab-content">
      <slot></slot>
    </div>
`,

  is: 'paper-tab',

  behaviors: [IronControlState, IronButtonState, PaperRippleBehavior],

  properties: {

    /**
     * If true, the tab will forward keyboard clicks (enter/space) to
     * the first anchor element found in its descendants
     */
    link: {type: Boolean, value: false, reflectToAttribute: true}

  },

  /** @private */
  hostAttributes: {role: 'tab'},

  listeners: {down: '_updateNoink', tap: '_onTap'},

  attached: function() {
    this._updateNoink();
  },

  get _parentNoink() {
    var parent = dom(this).parentNode;
    return !!parent && !!parent.noink;
  },

  _updateNoink: function() {
    this.noink = !!this.noink || !!this._parentNoink;
  },

  _onTap: function(event) {
    if (this.link) {
      var anchor = this.queryEffectiveChildren('a');

      if (!anchor) {
        return;
      }

      // Don't get stuck in a loop delegating
      // the listener from the child anchor
      if (event.target === anchor) {
        return;
      }

      anchor.click();
    }
  }
});
