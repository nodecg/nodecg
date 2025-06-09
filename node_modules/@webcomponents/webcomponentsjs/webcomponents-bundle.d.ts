/**
 * @license
 * Copyright (c) 2021 The Polymer Project Authors. All rights reserved. This
 * code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

// When building externally, this file is always assumed to be a module, but by
// default it isn't when building internally, so we need this export statement.
export {};

declare global {
  // eslint-disable-next-line no-var
  var WebComponents: {};
}

/**
 * @license
 * Copyright (c) 2021 The Polymer Project Authors. All rights reserved. This
 * code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

// When building externally, this file is always assumed to be a module, but by
// default it isn't when building internally, so we need this export statement.
export {};

declare global {
  interface CustomElementRegistry {
    forcePolyfill?: boolean;
    polyfillWrapFlushCallback?(outer: (fn: () => void) => void): void;
    noDocumentConstructionObserver?: boolean;
    shadyDomFastWalk?: boolean;
  }
}

/**
 * @license
 * Copyright (c) 2021 The Polymer Project Authors. All rights reserved. This
 * code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

// When building externally, this file is always assumed to be a module, but by
// default it isn't when building internally, so we need this export statement.
export {};

declare global {
  interface ShadyCSSInterface {
    styleElement(element: HTMLElement): void;
    styleSubtree(
      element: HTMLElement,
      properties?: {[name: string]: string}
    ): void;
    prepareTemplate(
      template: HTMLTemplateElement,
      elementName: string,
      elementExtends?: string
    ): void;
    prepareTemplateStyles(
      template: HTMLTemplateElement,
      elementName: string,
      elementExtends?: string
    ): void;
    prepareTemplateDom(
      template: HTMLTemplateElement,
      elementName: string
    ): void;
    styleDocument(properties?: {[name: string]: string}): void;
    flushCustomStyles(): void;
    getComputedStyleValue(element: Element, property: string): string;
    ScopingShim?: {
      prepareAdoptedCssText(
        cssTextArray: Array<string>,
        elementName: string
      ): void;
      flush(): void;
    };
    ApplyShim?: Object;
    CustomStyleInterface?: Object;
    nativeCss: boolean;
    nativeShadow: boolean;
    cssBuild?: string;
    disableRuntime: boolean;
  }

  interface ShadyCSSOptions {
    shimcssproperties?: boolean;
    shimshadow?: boolean;
    cssBuild?: boolean;
    disableRuntime?: boolean;
  }

  // This type alias exists because Tsickle will replace any type name used in the
  // type of something with the same name with `?`. (Maybe a Closure limitation?)
  // Making `ShadyCSS` an alias to an underlying type with a different name works
  // around this because Tsickle appears to resolve type aliases in its output: it
  // writes `undefined|ShadyCSSInterface` instead of `undefined|?` as the type for
  // the `ShadyCSS` global.
  type ShadyCSS = ShadyCSSInterface;
  // eslint-disable-next-line no-var
  var ShadyCSS: ShadyCSS | undefined;
}

/**
 * @license
 * Copyright (c) 2021 The Polymer Project Authors. All rights reserved. This
 * code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

// When building externally, this file is always assumed to be a module, but by
// default it isn't when building internally, so we need this export statement.
export {};

declare global {
  interface ShadyDOMInterface {
    flush: () => void;
    inUse: boolean;
    nativeMethods: {
      querySelectorAll: typeof document.querySelectorAll;
    };
    noPatch: boolean | string;
    patchElementProto: (node: Object) => void;
    querySelectorImplementation?: 'native' | 'selectorEngine';
    wrap: (node: Node) => Node;
  }

  // This type alias exists because Tsickle will replace any type name used in the
  // type of something with the same name with `?`. (Maybe a Closure limitation?)
  // Making `ShadyDOM` an alias to an underlying type with a different name works
  // around this because Tsickle appears to resolve type aliases in its output: it
  // writes `undefined|ShadyDOMInterface` instead of `undefined|?` as the type for
  // the `ShadyDOM` global.
  type ShadyDOM = ShadyDOMInterface;
  // eslint-disable-next-line no-var
  var ShadyDOM: ShadyDOM;
}

/**
 * @license
 * Copyright (c) 2021 The Polymer Project Authors. All rights reserved. This
 * code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

// When building externally, this file is always assumed to be a module, but by
// default it isn't when building internally, so we need this export statement.
export {};

declare global {
  interface HTMLTemplateElementConstructor {
    bootstrap(): void;
  }
}
