import { ElementMixin } from "./element-mixin";

export { html } from "@polymer/polymer/lib/utils/html-tag.js";

export { PolymerElement };

/**
 * Base class that provides the core API for Polymer's meta-programming
 * features including template stamping, data-binding, attribute deserialization,
 * and property change observation.
 */
declare class PolymerElement extends ElementMixin(HTMLElement) {}
