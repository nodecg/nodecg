/**
@license
Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
const nativeAppendChild = Node.prototype.appendChild;
const installAppend = (constructor) => {
    const prototype = constructor.prototype;
    if (prototype.hasOwnProperty('append')) {
        return;
    }
    Object.defineProperty(prototype, 'append', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function append(...args) {
            for (const arg of args) {
                nativeAppendChild.call(this, typeof arg === 'string' ? document.createTextNode(arg) : arg);
            }
        },
    });
};
installAppend(Document);
installAppend(DocumentFragment);
installAppend(Element);
export {};
//# sourceMappingURL=append.js.map