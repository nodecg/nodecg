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
`<scale-down-animation>` animates the scale transform of an element from 1 to 0.
By default it scales in both the x and y axes.

Configuration:
```
{
  name: 'scale-down-animation',
  node: <node>,
  axis: 'x' | 'y' | '',
  transformOrigin: <transform-origin>,
  timing: <animation-timing>
}
```
*/
Polymer({

  is: 'scale-down-animation',

  behaviors: [NeonAnimationBehavior],

  configure: function(config) {
    var node = config.node;

    var scaleProperty = 'scale(0, 0)';
    if (config.axis === 'x') {
      scaleProperty = 'scale(0, 1)';
    } else if (config.axis === 'y') {
      scaleProperty = 'scale(1, 0)';
    }

    this._effect = new KeyframeEffect(
        node,
        [
          {'transform': 'scale(1,1)'},
          {'transform': scaleProperty},
        ],
        this.timingFromConfig(config));

    if (config.transformOrigin) {
      this.setPrefixedProperty(node, 'transformOrigin', config.transformOrigin);
    }

    return this._effect;
  }

});
