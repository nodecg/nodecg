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
import * as legacyLit from './lit-html.js';
export declare const PartType: {
    readonly ATTRIBUTE: 1;
    readonly CHILD: 2;
    readonly PROPERTY: 3;
    readonly BOOLEAN_ATTRIBUTE: 4;
    readonly EVENT: 5;
    readonly ELEMENT: 6;
};
export declare type PartType = typeof PartType[keyof typeof PartType];
export interface ChildPartInfo {
    readonly type: typeof PartType.CHILD;
}
export interface AttributePartInfo {
    readonly type: typeof PartType.ATTRIBUTE | typeof PartType.PROPERTY | typeof PartType.BOOLEAN_ATTRIBUTE | typeof PartType.EVENT;
    readonly strings?: ReadonlyArray<string>;
    readonly name: string;
    readonly tagName: string;
}
export declare type Part = ChildPart | AttributePart | BooleanAttributePart | EventPart;
export { ChildPart };
declare class ChildPart {
    readonly type: 2;
    readonly options: legacyLit.RenderOptions | undefined;
    readonly legacyPart: legacyLit.NodePart;
    constructor(legacyPart: legacyLit.NodePart);
    readonly parentNode: Node;
    readonly startNode: Node | null;
    readonly endNode: Node | null;
}
export { AttributePart };
declare class AttributePart {
    readonly type: typeof PartType.ATTRIBUTE | typeof PartType.PROPERTY;
    readonly legacyPart: legacyLit.AttributePart | legacyLit.PropertyPart;
    readonly options: legacyLit.RenderOptions | undefined;
    readonly name: string;
    readonly element: Element;
    readonly strings: readonly string[];
    readonly tagName: string;
    constructor(legacyPart: legacyLit.AttributePart | legacyLit.PropertyPart);
}
export { BooleanAttributePart };
declare class BooleanAttributePart {
    readonly type: 4;
    readonly legacyPart: legacyLit.BooleanAttributePart;
    readonly options: legacyLit.RenderOptions | undefined;
    readonly name: string;
    readonly element: Element;
    readonly strings: readonly string[];
    readonly tagName: string;
    constructor(legacyPart: legacyLit.BooleanAttributePart);
}
export { EventPart };
declare class EventPart {
    readonly type: 5;
    readonly legacyPart: legacyLit.EventPart;
    constructor(legacyPart: legacyLit.EventPart);
    readonly options: legacyLit.RenderOptions | undefined;
    readonly name: string;
    readonly element: Element;
    readonly strings: undefined;
    readonly tagName: string;
    handleEvent(event: Event): void;
}
/**
 * Information about the part a directive is bound to.
 *
 * This is useful for checking that a directive is attached to a valid part,
 * such as with directive that can only be used on attribute bindings.
 */
export declare type PartInfo = ChildPartInfo | AttributePartInfo;
export interface DirectiveClass {
    new (part: PartInfo): Directive;
}
/**
 * This utility type extracts the signature of a directive class's render()
 * method so we can use it for the type of the generated directive function.
 */
export declare type DirectiveParameters<C extends Directive> = Parameters<C['render']>;
/**
 * A generated directive function doesn't evaluate the directive, but just
 * returns a DirectiveResult object that captures the arguments.
 */
export declare type DirectiveResult<C extends DirectiveClass = DirectiveClass> = {
    /** @internal */
    _$litDirective$: C;
    /** @internal */
    values: DirectiveParameters<InstanceType<C>>;
};
/**
 * Base class for creating custom directives. Users should extend this class,
 * implement `render` and/or `update`, and then pass their subclass to
 * `directive`.
 */
export declare abstract class Directive {
    constructor(_partInfo: PartInfo);
    abstract render(...args: Array<unknown>): unknown;
    update(_part: Part, args: Array<unknown>): unknown;
}
/**
 * Creates a user-facing directive function from a Directive class. This
 * function has the same parameters as the directive's render() method.
 *
 * N.B. In Lit 2, the directive will lose state if another directive is
 * executed on the same part as the directive instance is destroyed. This
 * version deviates from this behavior and will keep its state.
 */
export declare function directive<C extends DirectiveClass>(directiveClass: C): (...args: Parameters<InstanceType<C>["render"]>) => (part: legacyLit.Part) => void;
//# sourceMappingURL=directive.d.ts.map
