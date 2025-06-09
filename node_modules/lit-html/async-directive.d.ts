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
import { Directive, PartInfo } from './directive.js';
/**
 * A superclass for directives that need to asynchronously update.
 */
export declare abstract class AsyncDirective extends Directive {
    private readonly _legacyPart;
    private _renderedYet;
    constructor(partInfo: PartInfo);
    private _legacyGetNode;
    private _shouldRender;
    setValue(value: unknown): void;
    /**
     * User callback for implementing logic to release any
     * resources/subscriptions that may have been retained by this directive.
     * Since directives may also be re-connected, `reconnected` should also be
     * implemented to restore the working state of the directive prior to the next
     * render.
     *
     * NOTE: In lit-html 1.x, the `disconnected` and `reconnected` callbacks WILL
     * NOT BE CALLED. The interface is provided here for forward-compatible
     * directive authoring only.
     */
    protected disconnected(): void;
    /**
     * User callback to restore the working state of the directive prior to the
     * next render. This should generally re-do the work that was undone in
     * `disconnected`.
     *
     * NOTE: In lit-html 1.x, the `disconnected` and `reconnected` callbacks WILL
     * NOT BE CALLED. The interface is provided here for forward-compatible
     * directive authoring only.
     */
    protected reconnected(): void;
}
//# sourceMappingURL=async-directive.d.ts.map