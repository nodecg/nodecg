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
import {NeonSharedElementAnimationBehavior} from '../neon-shared-element-animation-behavior.js';
/*
`<hero-animation>` is a shared element animation that scales and transform an
element such that it appears to be shared between two pages. Use this in
`<neon-animated-pages>`. The source page should use this animation in an 'exit'
animation and set the `fromPage` configuration property to itself, and the
destination page should use this animation in an `entry` animation and set the
`toPage` configuration property to itself. They should also define the hero
elements in the `sharedElements` property (not a configuration property, see
`NeonSharedElementAnimatableBehavior`).

Configuration:
```
{
  name: 'hero-animation',
  id: <shared-element-id>,
  timing: <animation-timing>,
  toPage: <node>, /* define for the destination page *\/
  fromPage: <node>, /* define for the source page *\/
}
```
*/
Polymer({

  is: 'hero-animation',

  behaviors: [NeonSharedElementAnimationBehavior],

  configure: function(config) {
    var shared = this.findSharedElements(config);
    if (!shared) {
      return;
    }

    var fromRect = shared.from.getBoundingClientRect();
    var toRect = shared.to.getBoundingClientRect();

    var deltaLeft = fromRect.left - toRect.left;
    var deltaTop = fromRect.top - toRect.top;
    var deltaWidth = fromRect.width / toRect.width;
    var deltaHeight = fromRect.height / toRect.height;

    this._effect = new KeyframeEffect(
        shared.to,
        [
          {
            'transform': 'translate(' + deltaLeft + 'px,' + deltaTop +
                'px) scale(' + deltaWidth + ',' + deltaHeight + ')'
          },
          {'transform': 'none'}
        ],
        this.timingFromConfig(config));

    this.setPrefixedProperty(shared.to, 'transformOrigin', '0 0');
    shared.to.style.zIndex = 10000;
    shared.from.style.visibility = 'hidden';

    return this._effect;
  },

  complete: function(config) {
    var shared = this.findSharedElements(config);
    if (!shared) {
      return null;
    }
    shared.to.style.zIndex = '';
    shared.from.style.visibility = '';
  }

});
