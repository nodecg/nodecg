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
const Element_prototype = window.Element.prototype;
const HTMLElement_prototype = window.HTMLElement.prototype;
const SVGElement_prototype = window['SVGElement'].prototype;
// Thanks to @justinfagnani for finding this:
//
// In IE11, `classList` is only supported on `HTMLElement` instances: the
// descriptor is an own property of `HTMLElement.prototype` and is an accessor
// descriptor with `set` as `undefined` and no `get`. However, it seems to be
// implemented generically enough such that copying it to something in the
// prototype chain of `SVGElement` correctly adds support for `classList` (as
// far as `DOMTokenList` implemented in IE11).
if (HTMLElement_prototype.hasOwnProperty('classList') &&
    !Element_prototype.hasOwnProperty('classList') &&
    !SVGElement_prototype.hasOwnProperty('classList')) {
    Object.defineProperty(Element_prototype, 'classList', Object.getOwnPropertyDescriptor(HTMLElement_prototype, 'classList'));
}
export {};
//# sourceMappingURL=svg-element-class-list.js.map