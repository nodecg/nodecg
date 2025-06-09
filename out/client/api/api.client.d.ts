import type { DeepReadonly } from "ts-essentials";
import { NodeCGAPIBase } from "../../shared/api.base";
import type { NodeCG } from "../../types/nodecg";
import type { TypedClientSocket } from "../../types/socket-protocol";
import { filteredConfig } from "./config";
import { ClientReplicant } from "./replicant";
type SendMessageCb<T> = (error?: unknown, response?: T) => void;
type ReadReplicantCb<T = unknown> = (value: T | undefined) => void;
interface EventMap {
}
export declare class NodeCGAPIClient<C extends Record<string, any> = NodeCG.Bundle.UnknownConfig> extends NodeCGAPIBase<"client", C, EventMap> {
    static Replicant<V, O extends NodeCG.Replicant.Options<V> = NodeCG.Replicant.Options<V>>(name: string, namespace: string, opts?: O): ClientReplicant<V, O>;
    static sendMessageToBundle<T = unknown>(messageName: string, bundleName: string, cb: SendMessageCb<T>): void;
    static sendMessageToBundle<T = unknown>(messageName: string, bundleName: string, data?: unknown): Promise<T>;
    static sendMessageToBundle<T = unknown>(messageName: string, bundleName: string, data: unknown, cb: SendMessageCb<T>): void;
    static readReplicant<T = unknown>(name: string, namespace: string, cb: ReadReplicantCb<T>): void;
    get Logger(): new (name: string) => NodeCG.Logger;
    get log(): NodeCG.Logger;
    /**
     * A filtered copy of the NodeCG server config with some sensitive keys removed.
     */
    get config(): DeepReadonly<typeof filteredConfig>;
    readonly socket: TypedClientSocket;
    soundsReady: boolean;
    private readonly _soundFiles?;
    private readonly _bundleVolume?;
    private readonly _masterVolume?;
    private _soundCues;
    private _memoizedLogger?;
    constructor(bundle: NodeCG.Bundle & {
        _hasSounds?: boolean;
    }, socket: TypedClientSocket);
    /**
     * _Browser only, except workers_<br/>
     * Returns the specified dialog element.
     * @param {string} name - The desired dialog's name.
     * @param {string} [bundle=CURR_BNDL] - The bundle from which to select the dialog.
     * @returns {object}
     */
    getDialog(name: string, bundle?: string): (HTMLElement & {
        opened: boolean;
        close: () => void;
        open: () => void;
    }) | undefined;
    /**
     * _Browser only, except workers_<br/>
     * Returns the specified dialog's iframe document.
     * @param {string} name - The desired dialog's name.
     * @param {string} [bundle=CURR_BNDL] - The bundle from which to select the dialog.
     * @returns {object}
     */
    getDialogDocument(name: string, bundle?: string): Document | undefined;
    /**
     * Returns the sound cue of the provided `cueName` in the current bundle.
     * Returns undefined if a cue by that name cannot be found in this bundle.
     */
    findCue(cueName: string): NodeCG.SoundCue | undefined;
    /**
     * Plays the sound cue of the provided `cueName` in the current bundle.
     * Does nothing if the cue doesn't exist or if the cue has no assigned file to play.
     * @param cueName {String}
     * @param [opts] {Object}
     * @param [opts.updateVolume=true] - Whether or not to let NodeCG automatically update this instance's volume
     * when the user changes it on the dashboard.
     * @returns {Object|undefined} - A SoundJS AbstractAudioInstance.
     */
    playSound(cueName: string, { updateVolume }?: {
        updateVolume: boolean;
    }): createjs.AbstractSoundInstance;
    /**
     * Stops all currently playing instances of the provided `cueName`.
     * @param cueName {String}
     */
    stopSound(cueName: string): void;
    /**
     * Stops all currently playing sounds on the page.
     */
    stopAllSounds(): void;
    sendMessageToBundle<T = unknown>(messageName: string, bundleName: string, cb: SendMessageCb<T>): void;
    sendMessageToBundle<T = unknown>(messageName: string, bundleName: string, data?: unknown): Promise<T>;
    sendMessageToBundle<T = unknown>(messageName: string, bundleName: string, data: unknown, cb: SendMessageCb<T>): void;
    sendMessage<T = unknown>(messageName: string, cb: SendMessageCb<T>): void;
    sendMessage<T = unknown>(messageName: string, data?: unknown): Promise<T>;
    sendMessage<T = unknown>(messageName: string, data: unknown, cb: SendMessageCb<T>): void;
    readReplicant<T = unknown>(name: string, cb: ReadReplicantCb<T>): void;
    readReplicant<T = unknown>(name: string, namespace: string, cb: ReadReplicantCb<T>): void;
    protected _replicantFactory: <V, O extends NodeCG.Replicant.Options<V> = NodeCG.Replicant.Options<V>>(name: string, namespace: string, opts: O) => ClientReplicant<V, O>;
    private _registerSounds;
    private _setInstanceVolume;
    private _updateInstanceVolumes;
}
export {};
