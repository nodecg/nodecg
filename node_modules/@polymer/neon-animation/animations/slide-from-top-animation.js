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
`<slide-from-top-animation>` animates the transform of an element from
`translateY(-100%)` to `none`. The `transformOrigin` defaults to `50% 0`.

Configuration:
```
{
  name: 'slide-from-top-animation',
  node: <node>,
  transformOrigin: <transform-origin>,
  timing: <animation-timing>
}
```
*/
Polymer({
  is: 'slide-from-top-animation',

  behaviors: [NeonAnimationBehavior],

  configure: function(config) {
    var node = config.node;

    this._effect = new KeyframeEffect(
        node,
        [{'transform': 'translateY(-100%)'}, {'transform': 'translateY(0%)'}],
        this.timingFromConfig(config));

    if (config.transformOrigin) {
      this.setPrefixedProperty(node, 'transformOrigin', config.transformOrigin);
    } else {
      this.setPrefixedProperty(node, 'transformOrigin', '50% 0');
    }

    return this._effect;
  }

});
