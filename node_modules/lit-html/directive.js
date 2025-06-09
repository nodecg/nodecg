/**
 * @license
 * Copyright (c) 2021 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import { directive as legacyDirective } from './lib/directive.js';
import * as legacyLit from './lit-html.js';
export const PartType = {
    ATTRIBUTE: 1,
    CHILD: 2,
    PROPERTY: 3,
    BOOLEAN_ATTRIBUTE: 4,
    EVENT: 5,
    ELEMENT: 6,
};
class ChildPart {
    constructor(legacyPart) {
        this.type = PartType.CHILD;
        this.options = legacyPart.options;
        this.legacyPart = legacyPart;
    }
    get parentNode() {
        return this.legacyPart.startNode.parentNode;
    }
    get startNode() {
        return this.legacyPart.startNode;
    }
    get endNode() {
        return this.legacyPart.endNode;
    }
}
class AttributePart {
    constructor(legacyPart) {
        this.legacyPart = legacyPart;
        this.type = (legacyPart instanceof legacyLit.PropertyPart) ?
            PartType.PROPERTY :
            PartType.ATTRIBUTE;
    }
    get options() {
        return undefined;
    }
    get name() {
        return this.legacyPart.committer.name;
    }
    get element() {
        return this.legacyPart.committer.element;
    }
    /**
     * If this attribute part represents an interpolation, this contains the
     * static strings of the interpolation. For single-value, complete bindings,
     * this is undefined.
     */
    get strings() {
        return this.legacyPart.committer.strings;
    }
    get tagName() {
        return this.element.tagName;
    }
}
class BooleanAttributePart {
    constructor(legacyPart) {
        this.type = PartType.BOOLEAN_ATTRIBUTE;
        this.legacyPart = legacyPart;
    }
    get options() {
        return undefined;
    }
    get name() {
        return this.legacyPart.name;
    }
    get element() {
        return this.legacyPart.element;
    }
    /**
     * If this attribute part represents an interpolation, this contains the
     * static strings of the interpolation. For single-value, complete bindings,
     * this is undefined.
     */
    get strings() {
        return this.legacyPart.strings;
    }
    get tagName() {
        return this.element.tagName;
    }
}
class EventPart {
    constructor(legacyPart) {
        this.type = PartType.EVENT;
        this.legacyPart = legacyPart;
    }
    get options() {
        return undefined;
    }
    get name() {
        return this.legacyPart.eventName;
    }
    get element() {
        return this.legacyPart.element;
    }
    /**
     * If this attribute part represents an interpolation, this contains the
     * static strings of the interpolation. For single-value, complete bindings,
     * this is undefined.
     */
    get strings() {
        return undefined;
    }
    get tagName() {
        return this.element.tagName;
    }
    handleEvent(event) {
        this.legacyPart.handleEvent(event);
    }
}
// no equivalent for ElementPart in v1
function legacyPartToPart(part) {
    if (part instanceof legacyLit.NodePart) {
        return new ChildPart(part);
    }
    else if (part instanceof legacyLit.EventPart) {
        return new EventPart(part);
    }
    else if (part instanceof legacyLit.BooleanAttributePart) {
        return new BooleanAttributePart(part);
    }
    else if (part instanceof legacyLit.PropertyPart ||
        part instanceof legacyLit.AttributePart) {
        return new AttributePart(part);
    }
    // ElementPartInfo doesn't exist in lit-html v1
    throw new Error(`Unknown part type`);
}
/**
 * Base class for creating custom directives. Users should extend this class,
 * implement `render` and/or `update`, and then pass their subclass to
 * `directive`.
 */
export class Directive {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor(_partInfo) {
    }
    update(_part, args) {
        return this.render(...args);
    }
}
/**
 * Creates a user-facing directive function from a Directive class. This
 * function has the same parameters as the directive's render() method.
 *
 * N.B. In Lit 2, the directive will lose state if another directive is
 * executed on the same part as the directive instance is destroyed. This
 * version deviates from this behavior and will keep its state.
 */
export function directive(directiveClass) {
    const partToInstance = new WeakMap();
    const result = legacyDirective((...args) => {
        return (part) => {
            const cached = partToInstance.get(part);
            let modernPart, instance;
            if (cached === undefined) {
                modernPart = legacyPartToPart(part);
                instance = new directiveClass(modernPart);
                partToInstance.set(part, [modernPart, instance]);
            }
            else {
                modernPart = cached[0];
                instance = cached[1];
            }
            part.setValue(instance.update(modernPart, args));
            part.commit();
        };
    });
    return result;
}
//# sourceMappingURL=directive.js.map