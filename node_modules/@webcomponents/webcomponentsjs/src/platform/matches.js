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
var _a;
const Element_prototype = Element.prototype;
if (!Element_prototype.hasOwnProperty('matches')) {
    Element_prototype.matches =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (_a = Element_prototype.webkitMatchesSelector) !== null && _a !== void 0 ? _a : 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Element_prototype.msMatchesSelector;
}
export {};
//# sourceMappingURL=matches.js.map