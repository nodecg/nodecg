import "@polymer/iron-collapse/iron-collapse.js";
import "@polymer/iron-flex-layout/iron-flex-layout.js";
import "@polymer/iron-localstorage/iron-localstorage.js";
import "@polymer/paper-styles/element-styles/paper-material-styles.js";
import "@polymer/paper-styles/typography.js";
import * as Polymer from "@polymer/polymer";
export declare class NcgDashboardPanel extends Polymer.PolymerElement {
    static get template(): HTMLTemplateElement;
    static get is(): string;
    static get properties(): {
        displayTitle: {
            type: StringConstructor;
            reflectToAttribute: boolean;
        };
        bundle: {
            type: StringConstructor;
            reflectToAttribute: boolean;
        };
        panel: {
            type: StringConstructor;
            reflectToAttribute: boolean;
        };
        opened: {
            type: BooleanConstructor;
            reflectToAttribute: boolean;
            observer: string;
        };
        headerColor: {
            type: StringConstructor;
            reflectToAttribute: boolean;
            observer: string;
        };
        width: {
            type: NumberConstructor;
            reflectToAttribute: boolean;
        };
        transitioning: {
            type: BooleanConstructor;
            notify: boolean;
        };
        fullbleed: {
            type: BooleanConstructor;
            reflectToAttribute: boolean;
        };
    };
    ready(): void;
    _attachIframeResize(iframe: HTMLIFrameElement): void;
    connectedCallback(): void;
    toggleCollapse(): void;
    initializeDefaultOpened(): void;
    _openedChanged(newVal: boolean): void;
    _headerColorChanged(newVal: string): void;
    computeLocalStorageName(bundle: string, panel: string): string;
    _calcLinearGradient(rgb: {
        r: number;
        g: number;
        b: number;
    }): string;
    _hexToRGB(hex: string): {
        r: number;
        g: number;
        b: number;
    } | null;
}
