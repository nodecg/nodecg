import { NodeCGAPIBase } from "../../shared/api.base";
import { filteredConfig } from "./config";
import { Logger } from "./logger";
import { ClientReplicant } from "./replicant";
const soundMetadata = new WeakMap();
const apiContexts = new Set();
/**
 * This is what enables intra-context messaging.
 * I.e., passing messages from one extension to another in the same Node.js context.
 */
function _forwardMessageToContext(messageName, bundleName, data) {
    setTimeout(() => {
        apiContexts.forEach((ctx) => {
            ctx._messageHandlers.forEach((handler) => {
                if (messageName === handler.messageName &&
                    bundleName === handler.bundleName) {
                    handler.func(data);
                }
            });
        });
    }, 0);
}
export class NodeCGAPIClient extends NodeCGAPIBase {
    static Replicant(name, namespace, opts = {}) {
        return new ClientReplicant(name, namespace, opts, globalThis.socket);
    }
    static sendMessageToBundle(messageName, bundleName, dataOrCb, cb) {
        let data = null;
        if (typeof dataOrCb === "function") {
            cb = dataOrCb;
        }
        else {
            data = dataOrCb;
        }
        _forwardMessageToContext(messageName, bundleName, data);
        if (typeof cb === "function") {
            globalThis.socket.emit("message", {
                bundleName,
                messageName,
                content: data,
            }, (err, response) => {
                if (response) {
                    cb(err, response);
                }
                else {
                    cb(err);
                }
            });
        }
        else {
            return new Promise((resolve, reject) => {
                globalThis.socket.emit("message", {
                    bundleName,
                    messageName,
                    content: data,
                }, (err, response) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(response);
                    }
                });
            });
        }
    }
    static readReplicant(name, namespace, cb) {
        globalThis.socket.emit("replicant:read", { name, namespace }, (error, value) => {
            if (error) {
                console.error(error);
            }
            else {
                cb(value);
            }
        });
    }
    get Logger() {
        return Logger;
    }
    get log() {
        if (this._memoizedLogger) {
            return this._memoizedLogger;
        }
        this._memoizedLogger = new Logger(this.bundleName);
        return this._memoizedLogger;
    }
    /**
     * A filtered copy of the NodeCG server config with some sensitive keys removed.
     */
    get config() {
        return Object.freeze(JSON.parse(JSON.stringify(filteredConfig)));
    }
    constructor(bundle, socket) {
        var _a;
        super(bundle);
        this.soundsReady = false;
        this._soundCues = [];
        this._replicantFactory = (name, namespace, opts) => new ClientReplicant(name, namespace, opts, this.socket);
        apiContexts.add(this);
        // If title isn't set, set it to the bundle name
        if (globalThis.document) {
            document.addEventListener("DOMContentLoaded", () => {
                if (document.title === "") {
                    document.title = this.bundleName;
                }
            }, false);
        }
        // Make socket accessible to public methods
        this.socket = socket;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.socket.emit("joinRoom", bundle.name, () => { });
        if (globalThis.window && bundle._hasSounds && ((_a = window.createjs) === null || _a === void 0 ? void 0 : _a.Sound)) {
            const soundCuesRep = new ClientReplicant("soundCues", this.bundleName, {}, socket);
            this._soundFiles = new ClientReplicant("assets:sounds", this.bundleName, {}, socket);
            this._bundleVolume = new ClientReplicant(`volume:${this.bundleName}`, "_sounds", {}, socket);
            this._masterVolume = new ClientReplicant("volume:master", "_sounds", {}, socket);
            this._soundCues = [];
            const loadedSums = new Set();
            window.createjs.Sound.on("fileload", (e) => {
                if (this.soundsReady || !e.data.sum) {
                    return;
                }
                loadedSums.add(e.data.sum);
                const foundUnloaded = this._soundCues.some((cue) => {
                    if (cue.file) {
                        return !loadedSums.has(cue.file.sum);
                    }
                    return false;
                });
                if (!foundUnloaded && !this.soundsReady) {
                    this.soundsReady = true;
                    window.dispatchEvent(new CustomEvent("ncgSoundsReady"));
                }
            });
            const handleAnyCuesRepChange = () => {
                var _a;
                this._soundCues = (_a = soundCuesRep.value) !== null && _a !== void 0 ? _a : [];
                this._updateInstanceVolumes();
                this._registerSounds();
            };
            soundCuesRep.on("change", handleAnyCuesRepChange);
            this._soundFiles.on("change", () => this._registerSounds.bind(this));
            this._bundleVolume.on("change", () => this._updateInstanceVolumes.bind(this));
            this._masterVolume.on("change", () => this._updateInstanceVolumes.bind(this));
        }
        // Upon receiving a message, execute any handlers for it
        socket.on("message", (data) => {
            this.log.trace("Received message %s (sent to bundle %s) with data:", data.messageName, data.bundleName, data.content);
            this._messageHandlers.forEach((handler) => {
                if (data.messageName === handler.messageName &&
                    data.bundleName === handler.bundleName) {
                    handler.func(data.content);
                }
            });
        });
        socket.io.on("error", (err) => {
            this.log.warn("Unhandled socket connection error:", err);
        });
        socket.on("protocol_error", (err) => {
            if (err.type === "UnauthorizedError") {
                if (globalThis.window) {
                    const url = [
                        location.protocol,
                        "//",
                        location.host,
                        location.pathname,
                    ].join("");
                    window.location.href = `/authError?code=${err.code}&message=${err.message}&viewUrl=${url}`;
                }
                else {
                    globalThis.close();
                }
            }
            else {
                this.log.error("Unhandled socket protocol error:", err);
            }
        });
    }
    /**
     * _Browser only, except workers_<br/>
     * Returns the specified dialog element.
     * @param {string} name - The desired dialog's name.
     * @param {string} [bundle=CURR_BNDL] - The bundle from which to select the dialog.
     * @returns {object}
     */
    getDialog(name, bundle) {
        var _a, _b, _c, _d;
        if (!globalThis.window) {
            return undefined;
        }
        bundle = bundle !== null && bundle !== void 0 ? bundle : this.bundleName;
        const topDoc = (_a = window.top) === null || _a === void 0 ? void 0 : _a.document;
        if (!topDoc) {
            return undefined;
        }
        const dialog = (_c = (_b = topDoc
            .querySelector("ncg-dashboard")) === null || _b === void 0 ? void 0 : _b.shadowRoot) === null || _c === void 0 ? void 0 : _c.querySelector(`#dialogs #${bundle}_${name}`);
        return (_d = dialog) !== null && _d !== void 0 ? _d : undefined;
    }
    /**
     * _Browser only, except workers_<br/>
     * Returns the specified dialog's iframe document.
     * @param {string} name - The desired dialog's name.
     * @param {string} [bundle=CURR_BNDL] - The bundle from which to select the dialog.
     * @returns {object}
     */
    getDialogDocument(name, bundle) {
        var _a, _b, _c;
        if (!globalThis.window) {
            return undefined;
        }
        bundle = bundle !== null && bundle !== void 0 ? bundle : this.bundleName;
        return (_c = (_b = (_a = this.getDialog(name, bundle)) === null || _a === void 0 ? void 0 : _a.querySelector("iframe")) === null || _b === void 0 ? void 0 : _b.contentWindow) === null || _c === void 0 ? void 0 : _c.document;
    }
    /**
     * Returns the sound cue of the provided `cueName` in the current bundle.
     * Returns undefined if a cue by that name cannot be found in this bundle.
     */
    findCue(cueName) {
        return this._soundCues.find((cue) => cue.name === cueName);
    }
    /**
     * Plays the sound cue of the provided `cueName` in the current bundle.
     * Does nothing if the cue doesn't exist or if the cue has no assigned file to play.
     * @param cueName {String}
     * @param [opts] {Object}
     * @param [opts.updateVolume=true] - Whether or not to let NodeCG automatically update this instance's volume
     * when the user changes it on the dashboard.
     * @returns {Object|undefined} - A SoundJS AbstractAudioInstance.
     */
    playSound(cueName, { updateVolume = true } = { updateVolume: true }) {
        var _a;
        if (!globalThis.window) {
            throw new Error("NodeCG Sound API methods are not available in workers");
        }
        if (!this._soundCues) {
            throw new Error(`Bundle "${this.bundleName}" has no soundCues`);
        }
        const cue = this.findCue(cueName);
        if (!cue) {
            throw new Error(`Cue "${cueName}" does not exist in bundle "${this.bundleName}"`);
        }
        if (!((_a = window.createjs) === null || _a === void 0 ? void 0 : _a.Sound)) {
            throw new Error("NodeCG Sound API methods are not available when SoundJS isn't present");
        }
        if (!cue.file) {
            throw new Error(`Cue $"{cueName}" does not have a file specified.`);
        }
        // Create an instance of the sound, which begins playing immediately.
        const instance = window.createjs.Sound.play(cueName);
        // Set the volume.
        this._setInstanceVolume(instance, cue);
        soundMetadata.set(instance, { cueName, updateVolume });
        return instance;
    }
    /**
     * Stops all currently playing instances of the provided `cueName`.
     * @param cueName {String}
     */
    stopSound(cueName) {
        var _a;
        if (!globalThis.window) {
            throw new Error("NodeCG Sound API methods are not available in workers");
        }
        if (!this._soundCues) {
            throw new Error(`Bundle "${this.bundleName}" has no soundCues`);
        }
        if (!this._soundCues.find((cue) => cue.name === cueName)) {
            throw new Error(`Cue "${cueName}" does not exist in bundle "${this.bundleName}"`);
        }
        if (!((_a = window.createjs) === null || _a === void 0 ? void 0 : _a.Sound)) {
            throw new Error("NodeCG Sound API methods are not available when SoundJS isn't present");
        }
        const instancesArr = window.createjs.Sound
            ._instances;
        for (let i = instancesArr.length - 1; i >= 0; i--) {
            const instance = instancesArr[i];
            const meta = soundMetadata.get(instance);
            if (meta && meta.cueName === cueName) {
                instance.stop();
            }
        }
    }
    /**
     * Stops all currently playing sounds on the page.
     */
    stopAllSounds() {
        var _a;
        if (!globalThis.window) {
            throw new Error("NodeCG Sound API methods are not available in workers");
        }
        if (!((_a = window.createjs) === null || _a === void 0 ? void 0 : _a.Sound)) {
            throw new Error("NodeCG Sound API methods are not available when SoundJS isn't present");
        }
        window.createjs.Sound.stop();
    }
    sendMessageToBundle(messageName, bundleName, dataOrCb, cb) {
        return NodeCGAPIClient.sendMessageToBundle(messageName, bundleName, dataOrCb, cb);
    }
    sendMessage(messageName, dataOrCb, cb) {
        return this.sendMessageToBundle(messageName, this.bundleName, dataOrCb, cb);
    }
    readReplicant(name, nspOrCb, maybeCb) {
        let namespace = this.bundleName;
        let cb;
        if (typeof nspOrCb === "string") {
            namespace = nspOrCb;
            cb = maybeCb;
        }
        else {
            cb = nspOrCb;
        }
        NodeCGAPIClient.readReplicant(name, namespace, cb);
    }
    _registerSounds() {
        if (!globalThis.window) {
            throw new Error("NodeCG Sound API methods are not available in workers");
        }
        this._soundCues.forEach((cue) => {
            if (!cue.file) {
                return;
            }
            window.createjs.Sound.registerSound(`${cue.file.url}?sum=${cue.file.sum}`, cue.name, {
                channels: typeof cue.channels === "undefined" ? 100 : cue.channels,
                sum: cue.file.sum,
            });
        });
    }
    _setInstanceVolume(instance, cue) {
        var _a, _b;
        if (((_a = this._masterVolume) === null || _a === void 0 ? void 0 : _a.status) !== "declared" ||
            typeof this._masterVolume.value !== "number" ||
            ((_b = this._bundleVolume) === null || _b === void 0 ? void 0 : _b.status) !== "declared" ||
            typeof this._bundleVolume.value !== "number") {
            return;
        }
        const volume = (this._masterVolume.value / 100) *
            (this._bundleVolume.value / 100) *
            (cue.volume / 100);
        // Volue value must be finite or SoundJS throws error
        instance.volume = isFinite(volume) ? volume : 0;
    }
    _updateInstanceVolumes() {
        const instancesArr = window.createjs.Sound
            ._instances;
        // Update the volume of any playing instances that haven't opted out of automatic volume updates.
        this._soundCues.forEach((cue) => {
            instancesArr.forEach((instance) => {
                const meta = soundMetadata.get(instance);
                if (meta && meta.cueName === cue.name && meta.updateVolume) {
                    this._setInstanceVolume(instance, cue);
                }
            });
        });
    }
}
globalThis.NodeCG = NodeCGAPIClient;
//# sourceMappingURL=api.client.js.map