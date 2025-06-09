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
var _a, _b;
const Element_prototype = Element.prototype;
// In IE11, the `attributes` descriptor is on `Node.prototype`.
const attributesDescriptor = (_a = Object.getOwnPropertyDescriptor(Element_prototype, 'attributes')) !== null && _a !== void 0 ? _a : Object.getOwnPropertyDescriptor(Node.prototype, 'attributes');
// In Safari 9, the `attributes` descriptor's getter is undefined. In Chrome 41,
// the `attributes` descriptor is a data descriptor on each Element instance.
const getAttributes = (_b = attributesDescriptor === null || attributesDescriptor === void 0 ? void 0 : attributesDescriptor.get) !== null && _b !== void 0 ? _b : function () {
    return this.attributes;
};
const map = Array.prototype.map;
if (!Element_prototype.hasOwnProperty('getAttributeNames')) {
    Element_prototype.getAttributeNames = function getAttributeNames() {
        return map.call(getAttributes.call(this), (attr) => attr.name);
    };
}
export {};
//# sourceMappingURL=get-attribute-names.js.map