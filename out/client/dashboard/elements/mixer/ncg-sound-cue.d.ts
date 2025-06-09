import "@polymer/iron-flex-layout/iron-flex-layout.js";
import "@polymer/paper-slider/paper-slider.js";
import "@polymer/paper-styles/typography.js";
import * as Polymer from "@polymer/polymer";
import type { NodeCG as NCGTypes } from "../../../../types/nodecg";
export declare class NcgSoundCue extends Polymer.PolymerElement {
    static get template(): HTMLTemplateElement;
    static get is(): string;
    static get properties(): {
        name: StringConstructor;
        bundleName: {
            type: StringConstructor;
            observer: string;
        };
        assignable: {
            type: BooleanConstructor;
            observer: string;
        };
        file: {
            type: ObjectConstructor;
            observer: string;
        };
        defaultFile: ObjectConstructor;
        volume: {
            type: NumberConstructor;
            observer: string;
        };
        _cueRef: ObjectConstructor;
        soundFiles: ArrayConstructor;
        createdTimestamp: {
            type: NumberConstructor;
        };
    };
    _bundleNameChanged(bundleName: string): void;
    _assignableChanged(newVal: boolean): void;
    _fileChanged(newVal: NCGTypes.CueFile): void;
    _volumeChanged(newVal: number): void;
    _generateOptions(soundFiles: NCGTypes.AssetFile[]): void;
    _retargetFile(): void;
    _onSliderChange(e: any): void;
}
