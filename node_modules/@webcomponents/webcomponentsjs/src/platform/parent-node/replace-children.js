/**
@license
Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
var _a, _b;
const nativeAppendChild = Node.prototype.appendChild;
const nativeRemoveChild = Node.prototype.removeChild;
const nativeGetFirstChild = 
// In Chrome 41, `firstChild` is a data descriptor on every instance, not a
// accessor descriptor on `Node.prototype`.
(_b = (_a = Object.getOwnPropertyDescriptor(Node.prototype, 'firstChild')) === null || _a === void 0 ? void 0 : _a.get) !== null && _b !== void 0 ? _b : 
// In Safari 9, the `firstChild` descriptor's `get` and `set` are undefined.
function () {
    return this.firstChild;
};
const installReplaceChildren = (constructor) => {
    const prototype = constructor.prototype;
    if (prototype.hasOwnProperty('replaceChildren')) {
        return;
    }
    Object.defineProperty(prototype, 'replaceChildren', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function replaceChildren(...args) {
            let child;
            while ((child = nativeGetFirstChild.call(this)) !== null) {
                nativeRemoveChild.call(this, child);
            }
            for (const arg of args) {
                nativeAppendChild.call(this, typeof arg === 'string' ? document.createTextNode(arg) : arg);
            }
        },
    });
};
installReplaceChildren(Document);
installReplaceChildren(DocumentFragment);
installReplaceChildren(Element);
export {};
//# sourceMappingURL=replace-children.js.map