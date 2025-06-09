/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
import '@polymer/polymer/polymer-legacy.js';

import {PaperRippleBehavior} from '@polymer/paper-behaviors/paper-ripple-behavior.js';
import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';
import {afterNextRender} from '@polymer/polymer/lib/utils/render-status.js';

/**
This is a lighter version of `paper-icon-button`. Its goal is performance, not
developer ergonomics, so as a result it has fewer features than
`paper-icon-button` itself. To use it, you must distribute a `button` containing
the `iron-icon` you want to use:

<script type="module">
  import '@polymer/iron-icon/iron-icon.js';
  import '@polymer/paper-icon-button/paper-icon-button-light.js';
  import '@polymer/iron-icons/iron-icons.js';
</script>

<paper-icon-button-light>
  <button title="heart">
    <iron-icon icon="favorite"></iron-icon>
  </button>
</paper-icon-button-light>

Note that this button is assumed to be distributed at the startup of
`paper-icon-button-light`. Dynamically adding a `button` to this element is
not supported.

The `title`/`disabled` etc. attributes go on the distributed button, not on the
wrapper.

The following custom properties and mixins are also available for styling:
Custom property | Description | Default
----------------|-------------|----------
`--paper-icon-button-light-ripple` | Mixin applied to the paper ripple | `{}`

@group Paper Elements
@element paper-icon-button-light
@demo demo/paper-icon-button-light.html
*/
Polymer({
  is: 'paper-icon-button-light',

  _template: html`
    <style>
      :host {
        display: inline-block;
        position: relative;
        width: 24px;
        height: 24px;
      }

      paper-ripple {
        opacity: 0.6;
        color: currentColor;
        @apply --paper-icon-button-light-ripple;
      }

      :host > ::slotted(button) {
        position: relative;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background: none;
        border: none;
        outline: none;
        vertical-align: middle;
        color: inherit;
        cursor: pointer;
        /* NOTE: Both values are needed, since some phones require the value to be \`transparent\`. */
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        -webkit-tap-highlight-color: transparent;
      }
      :host > ::slotted(button[disabled]) {
        color: #9b9b9b;
        pointer-events: none;
        cursor: auto;
      }
    </style>
    <slot></slot>
  `,

  behaviors: [PaperRippleBehavior],

  registered: function() {
    this._template.setAttribute('strip-whitespace', '');
  },

  ready: function() {
    afterNextRender(this, () => {
      // Add lazy host listeners
      this.addEventListener('down', this._rippleDown.bind(this));
      this.addEventListener('up', this._rippleUp.bind(this));

      // Assume the button has already been distributed.
      var button = this.getEffectiveChildren()[0];
      this._rippleContainer = button;

      // We need to set the focus/blur listeners on the distributed button,
      // not the host, since the host isn't focusable.
      button.addEventListener('focus', this._rippleDown.bind(this));
      button.addEventListener('blur', this._rippleUp.bind(this));
    });
  },
  _rippleDown: function() {
    this.getRipple().uiDownAction();
  },
  _rippleUp: function() {
    this.getRipple().uiUpAction();
  },
  /**
   * @param {...*} var_args
   */
  ensureRipple: function(var_args) {
    var lastRipple = this._ripple;
    PaperRippleBehavior.ensureRipple.apply(this, arguments);
    if (this._ripple && this._ripple !== lastRipple) {
      this._ripple.center = true;
      this._ripple.classList.add('circle');
    }
  }
});
