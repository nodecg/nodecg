import type { NodeCG } from "../../types/nodecg";
interface Options {
    standalone?: boolean;
    createApiInstance?: NodeCG.Bundle;
    sound?: boolean;
    fullbleed?: boolean;
}
/**
 * Injects the appropriate assets into a panel, dialog, or graphic.
 */
export declare function injectScripts(pathOrHtml: string, resourceType: "panel" | "dialog" | "graphic", { standalone, createApiInstance, sound, fullbleed, }?: Options, cb?: (html: string) => void): void;
export {};
