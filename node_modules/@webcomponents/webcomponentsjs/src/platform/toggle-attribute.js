/**
@license
Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
const Element_prototype = Element.prototype;
const nativeHasAttribute = Element.prototype.hasAttribute;
const nativeSetAttribute = Element.prototype.setAttribute;
const nativeRemoveAttribute = Element.prototype.removeAttribute;
if (!Element_prototype.hasOwnProperty('toggleAttribute')) {
    Element_prototype.toggleAttribute = function toggleAttribute(name, force) {
        if (force === undefined) {
            if (nativeHasAttribute.call(this, name)) {
                nativeRemoveAttribute.call(this, name);
                return false;
            }
            else {
                nativeSetAttribute.call(this, name, '');
                return true;
            }
        }
        if (force) {
            if (!nativeHasAttribute.call(this, name)) {
                nativeSetAttribute.call(this, name, '');
            }
            return true;
        }
        // force is falsey
        nativeRemoveAttribute.call(this, name);
        return false;
    };
}
export {};
//# sourceMappingURL=toggle-attribute.js.map