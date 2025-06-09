/**
@license
Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
var _a, _b, _c, _d;
const nativeInsertBefore = Node.prototype.insertBefore;
const nativeGetParentNode = (_b = (_a = Object.getOwnPropertyDescriptor(Node.prototype, 'parentNode')) === null || _a === void 0 ? void 0 : _a.get) !== null && _b !== void 0 ? _b : 
// In Safari 9, the `parentNode` descriptor's `get` and `set` are undefined.
function () {
    return this.parentNode;
};
const nativeGetNextSibling = (_d = (_c = Object.getOwnPropertyDescriptor(Node.prototype, 'nextSibling')) === null || _c === void 0 ? void 0 : _c.get) !== null && _d !== void 0 ? _d : 
// In Safari 9, the `nextSibling` descriptor's `get` and `set` are
// undefined.
function () {
    return this.nextSibling;
};
const installAfter = (constructor) => {
    const prototype = constructor.prototype;
    if (prototype.hasOwnProperty('after')) {
        return;
    }
    Object.defineProperty(prototype, 'after', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function after(...args) {
            const parentNode = nativeGetParentNode.call(this);
            if (parentNode === null) {
                return;
            }
            const nextSibling = nativeGetNextSibling.call(this);
            for (const arg of args) {
                nativeInsertBefore.call(parentNode, typeof arg === 'string' ? document.createTextNode(arg) : arg, nextSibling);
            }
        },
    });
};
installAfter(CharacterData);
installAfter(Element);
export {};
//# sourceMappingURL=after.js.map