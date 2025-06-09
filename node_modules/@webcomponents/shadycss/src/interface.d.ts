/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
declare type CustomPropertyValues = {
    [property: string]: string;
};
/**
 * Prepare the given custom element template for use with the ShadyCSS style
 * scoping polyfill. You only need to do this once per template.
 *
 * If ShadyCSS is not active, then this function does nothing.
 *
 * If ShadyCSS is active, then after styleElement is called on the first
 * instance of this element, <style> tags within this template will be moved to
 * the <head> and re-written to use globally scoped rules that emulate scoped
 * behavior.
 *
 * Note that LitElement and Polymer Library users do not typically need to call
 * this function, because it is called automatically.
 */
export declare function prepareTemplate(template: HTMLTemplateElement, customElementName: string): void;
/**
 * Activate scoped styles for the given element instance. This function should
 * typically be called inside connectedCallback. The template of this element
 * class must already have been registered with prepareTemplate.
 *
 * If ShadyCSS is not active, then this function does nothing.
 *
 * Note that LitElement and Polymer Library users do not typically need to call
 * this function, because it is called automatically.
 */
export declare function styleElement(element: HTMLElement): void;
/**
 * Propagate CSS custom properties on this element to all descendant shadow
 * roots, and optionally set new ones.
 *
 * Uses ShadyCSS custom property emulation if the polyfill is active, otherwise
 * calls native style.setProperty.
 */
export declare function styleSubtree(element: HTMLElement, properties?: CustomPropertyValues): void;
export {};
