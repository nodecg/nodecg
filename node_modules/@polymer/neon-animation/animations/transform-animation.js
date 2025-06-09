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

import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {NeonAnimationBehavior} from '../neon-animation-behavior.js';
/*
`<transform-animation>` animates a custom transform on an element. Use this to
animate multiple transform properties, or to apply a custom transform value.

Configuration:
```
{
  name: 'transform-animation',
  node: <node>,
  transformOrigin: <transform-origin>,
  transformFrom: <transform-from-string>,
  transformTo: <transform-to-string>,
  timing: <animation-timing>
}
```
*/
Polymer({
  is: 'transform-animation',

  behaviors: [NeonAnimationBehavior],

  /**
   * @param {{
   *   node: !Element,
   *   transformOrigin: (string|undefined),
   *   transformFrom: (string|undefined),
   *   transformTo: (string|undefined),
   *   timing: (Object|undefined)
   * }} config
   */
  configure: function(config) {
    var node = config.node;
    var transformFrom = config.transformFrom || 'none';
    var transformTo = config.transformTo || 'none';

    this._effect = new KeyframeEffect(
        node,
        [{'transform': transformFrom}, {'transform': transformTo}],
        this.timingFromConfig(config));

    if (config.transformOrigin) {
      this.setPrefixedProperty(node, 'transformOrigin', config.transformOrigin);
    }

    return this._effect;
  }

});
