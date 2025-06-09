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

import {NeonAnimatableBehavior} from './neon-animatable-behavior.js';

/**
 * Use `NeonSharedElementAnimatableBehavior` to implement elements
 * containing shared element animations.
 * @polymerBehavior NeonSharedElementAnimatableBehavior
 */
export const NeonSharedElementAnimatableBehaviorImpl = {

  properties: {

    /**
     * A map of shared element id to node.
     */
    sharedElements: {type: Object, value: {}}

  }

};

/** @polymerBehavior */
export const NeonSharedElementAnimatableBehavior =
    [NeonAnimatableBehavior, NeonSharedElementAnimatableBehaviorImpl];
