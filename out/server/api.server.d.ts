import express from "express";
import type { DeepReadonly } from "ts-essentials";
import type { NodeCG } from "../types/nodecg";
import type { RootNS } from "../types/socket-protocol";
import { config } from "./config";
import type { Replicator } from "./replicant/replicator";
import type { ServerReplicant } from "./replicant/server-replicant";
import type { ExtensionEventMap } from "./server/extensions";
export declare function serverApiFactory(io: RootNS, replicator: Replicator, extensions: Record<string, unknown>, mount: NodeCG.Middleware): {
    new <C extends Record<string, any> = NodeCG.Bundle.UnknownConfig>(bundle: NodeCG.Bundle): {
        readonly Logger: new (name: string) => NodeCG.Logger;
        readonly log: NodeCG.Logger;
        /**
         * The full NodeCG server config, including potentially sensitive keys.
         */
        readonly config: DeepReadonly<typeof config>;
        /**
         * _Extension only_<br/>
         * Creates a new express router.
         * See the [express docs](http://expressjs.com/en/api.html#express.router) for usage.
         * @function
         */
        readonly Router: typeof express.Router;
        util: {
            /**
             * _Extension only_<br/>
             * Checks if a session is authorized. Intended to be used in express routes.
             * @param {object} req - A HTTP request.
             * @param {object} res - A HTTP response.
             * @param {function} next - The next middleware in the control flow.
             */
            authCheck: express.RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
        };
        /**
         * _Extension only_<br/>
         * Object containing references to all other loaded extensions. To access another bundle's extension,
         * it _must_ be declared as a `bundleDependency` in your bundle's [`package.json`]{@tutorial manifest}.
         * @name NodeCG#extensions
         *
         * @example
         * // bundles/my-bundle/package.json
         * {
         *     "name": "my-bundle"
         *     ...
         *     "bundleDependencies": {
         *         "other-bundle": "^1.0.0"
         *     }
         * }
         *
         * // bundles/my-bundle/extension.js
         * module.exports = function (nodecg) {
         *     const otherBundle = nodecg.extensions['other-bundle'];
         *     // Now I can use `otherBundle`!
         * }
         */
        readonly extensions: Record<string, unknown>;
        /**
         * _Extension only_<br/>
         * Mounts Express middleware to the main server Express app.
         * Middleware mounted using this method comes _after_ all the middlware that NodeCG
         * uses internally.
         * See the [Express docs](http://expressjs.com/en/api.html#app.use) for usage.
         * @function
         */
        mount: NodeCG.Middleware;
        _memoizedLogger?: NodeCG.Logger;
        /**
         * _Extension only_<br/>
         * Gets the server Socket.IO context.
         * @function
         */
        readonly getSocketIOServer: () => RootNS;
        /**
         * Sends a message to a specific bundle. Also available as a static method.
         * See {@link NodeCG#sendMessage} for usage details.
         * @param {string} messageName - The name of the message.
         * @param {string} bundleName - The name of the target bundle.
         * @param {mixed} [data] - The data to send.
         * @param {function} [cb] - _Browser only_ The error-first callback to handle the server's
         * [acknowledgement](http://socket.io/docs/#sending-and-getting-data-%28acknowledgements%29) message, if any.
         * @return {Promise|undefined} - _Browser only_ A Promise that is rejected if the first argument provided to the
         * acknowledgement is an `Error`, otherwise it is resolved with the remaining arguments provided to the acknowledgement.
         * But, if a callback was provided, this return value will be `undefined`, and there will be no Promise.
         */
        sendMessageToBundle(messageName: string, bundleName: string, data?: unknown): void;
        /**
         * Sends a message with optional data within the current bundle.
         * Messages can be sent from client to server, server to client, or client to client.
         *
         * Messages are namespaced by bundle. To send a message in another bundle's namespace,
         * use {@link NodeCG#sendMessageToBundle}.
         *
         * When a `sendMessage` is used from a client context (i.e., graphic or dashboard panel),
         * it returns a `Promise` called an "acknowledgement". Your server-side code (i.e., extension)
         * can invoke this acknowledgement with whatever data (or error) it wants. Errors sent to acknowledgements
         * from the server will be properly serialized and intact when received on the client.
         *
         * Alternatively, if you do not wish to use a `Promise`, you can provide a standard error-first
         * callback as the last argument to `sendMessage`.
         *
         * If your server-side code has multiple listenFor handlers for your message,
         * you must first check if the acknowledgement has already been handled before
         * attempting to call it. You may so do by checking the `.handled` boolean
         * property of the `ack` function passed to your listenFor handler.
         *
         * See [Socket.IO's docs](http://socket.io/docs/#sending-and-getting-data-%28acknowledgements%29)
         * for more information on how acknowledgements work under the hood.
         *
         * @param {string} messageName - The name of the message.
         * @param {mixed} [data] - The data to send.
         * @param {function} [cb] - _Browser only_ The error-first callback to handle the server's
         * [acknowledgement](http://socket.io/docs/#sending-and-getting-data-%28acknowledgements%29) message, if any.
         * @return {Promise} - _Browser only_ A Promise that is rejected if the first argument provided to the
         * acknowledgement is an `Error`, otherwise it is resolved with the remaining arguments provided to the acknowledgement.
         *
         * @example <caption>Sending a normal message:</caption>
         * nodecg.sendMessage('printMessage', 'dope.');
         *
         * @example <caption>Sending a message and replying with an acknowledgement:</caption>
         * // bundles/my-bundle/extension.js
         * module.exports = function (nodecg) {
         *     nodecg.listenFor('multiplyByTwo', (value, ack) => {
         *         if (value === 4) {
         *             ack(new Error('I don\'t like multiplying the number 4!');
         *             return;
         *         }
         *
         *         // acknowledgements should always be error-first callbacks.
         *         // If you do not wish to send an error, send "null"
         *         if (ack && !ack.handled) {
         *             ack(null, value * 2);
         *         }
         *     });
         * }
         *
         * // bundles/my-bundle/graphics/script.js
         * // Both of these examples are functionally identical.
         *
         * // Promise acknowledgement
         * nodecg.sendMessage('multiplyByTwo', 2)
         *     .then(result => {
         *         console.log(result); // Will eventually print '4'
         *     .catch(error => {
         *         console.error(error);
         *     });
         *
         * // Error-first callback acknowledgement
         * nodecg.sendMessage('multiplyByTwo', 2, (error, result) => {
         *     if (error) {
         *         console.error(error);
         *         return;
         *     }
         *
         *     console.log(result); // Will eventually print '4'
         * });
         */
        sendMessage(messageName: string, data?: unknown): void;
        /**
         * Reads the value of a replicant once, and doesn't create a subscription to it. Also available as a static method.
         * @param {string} name - The name of the replicant.
         * @param {string} [bundle=CURR_BNDL] - The bundle namespace to in which to look for this replicant.
         * @param {function} cb - _Browser only_ The callback that handles the server's response which contains the value.
         * @example <caption>From an extension:</caption>
         * // Extensions have immediate access to the database of Replicants.
         * // For this reason, they can use readReplicant synchronously, without a callback.
         * module.exports = function (nodecg) {
         *     var myVal = nodecg.readReplicant('myVar', 'some-bundle');
         * }
         * @example <caption>From a graphic or dashboard panel:</caption>
         * // Graphics and dashboard panels must query the server to retrieve the value,
         * // and therefore must provide a callback.
         * nodecg.readReplicant('myRep', 'some-bundle', value => {
         *     // I can use 'value' now!
         *     console.log('myRep has the value '+ value +'!');
         * });
         */
        readReplicant<T = unknown>(name: string, param2?: string | NodeCG.Bundle): T | undefined;
        _replicantFactory: <V, O extends NodeCG.Replicant.Options<V> = NodeCG.Replicant.Options<V>>(name: string, namespace: string, opts: O) => ServerReplicant<V, O>;
        readonly bundleName: string;
        readonly bundleConfig: DeepReadonly<C>;
        readonly bundleVersion?: string;
        readonly bundleGit: Readonly<NodeCG.Bundle.GitData>;
        _messageHandlers: import("../shared/api.base").MessageHandler[];
        listenFor(messageName: string, handlerFunc: NodeCG.ListenHandler): void;
        listenFor(messageName: string, bundleName: string, handlerFunc: NodeCG.ListenHandler): void;
        unlisten(messageName: string, handlerFunc: NodeCG.ListenHandler): boolean;
        unlisten(messageName: string, bundleName: string, handlerFunc: NodeCG.ListenHandler): boolean;
        Replicant<V, O_1 extends NodeCG.Replicant.OptionsNoDefault = NodeCG.Replicant.OptionsNoDefault>(name: string, namespace: string, opts?: O_1 | undefined): import("../shared/replicants.shared").AbstractReplicant<"server", V, O_1, false>;
        Replicant<V, O_2 extends NodeCG.Replicant.OptionsNoDefault = NodeCG.Replicant.OptionsNoDefault>(name: string, opts?: O_2 | undefined): import("../shared/replicants.shared").AbstractReplicant<"server", V, O_2, false>;
        Replicant<V, O_3 extends NodeCG.Replicant.OptionsNoDefault = NodeCG.Replicant.OptionsNoDefault>(name: string, namespaceOrOpts?: string | O_3 | undefined, opts?: O_3 | undefined): import("../shared/replicants.shared").AbstractReplicant<"server", V, O_3, false>;
        Replicant<V, O_4 extends NodeCG.Replicant.OptionsWithDefault<V> = NodeCG.Replicant.OptionsWithDefault<V>>(name: string, namespace: string, opts?: O_4 | undefined): import("../shared/replicants.shared").AbstractReplicant<"server", V, O_4, false>;
        Replicant<V, O_5 extends NodeCG.Replicant.OptionsWithDefault<V> = NodeCG.Replicant.OptionsWithDefault<V>>(name: string, opts?: O_5 | undefined): import("../shared/replicants.shared").AbstractReplicant<"server", V, O_5, false>;
        Replicant<V, O_6 extends NodeCG.Replicant.OptionsWithDefault<V> = NodeCG.Replicant.OptionsWithDefault<V>>(name: string, namespaceOrOpts?: string | O_6 | undefined, opts?: O_6 | undefined): import("../shared/replicants.shared").AbstractReplicant<"server", V, O_6, false>;
        Replicant<V, O_7 extends NodeCG.Replicant.Options<V> = NodeCG.Replicant.Options<V>>(name: string, namespace: string, opts?: O_7 | undefined): import("../shared/replicants.shared").AbstractReplicant<"server", V, O_7, false>;
        Replicant<V, O_8 extends NodeCG.Replicant.Options<V> = NodeCG.Replicant.Options<V>>(name: string, opts?: O_8 | undefined): import("../shared/replicants.shared").AbstractReplicant<"server", V, O_8, false>;
        readonly _emitter: import("events")<[never]>;
        addListener<K extends import("../shared/typed-emitter").EventKey<ExtensionEventMap & import("../shared/typed-emitter").Builtins>>(eventName: K, fn: (ExtensionEventMap & import("../shared/typed-emitter").Builtins)[K]): void;
        on<K extends import("../shared/typed-emitter").EventKey<ExtensionEventMap & import("../shared/typed-emitter").Builtins>>(eventName: K, fn: (ExtensionEventMap & import("../shared/typed-emitter").Builtins)[K]): void;
        off<K extends import("../shared/typed-emitter").EventKey<ExtensionEventMap & import("../shared/typed-emitter").Builtins>>(eventName: K, fn: (ExtensionEventMap & import("../shared/typed-emitter").Builtins)[K]): void;
        removeListener<K extends import("../shared/typed-emitter").EventKey<ExtensionEventMap & import("../shared/typed-emitter").Builtins>>(eventName: K, fn: (ExtensionEventMap & import("../shared/typed-emitter").Builtins)[K]): void;
        emit<K extends import("../shared/typed-emitter").EventKey<ExtensionEventMap & import("../shared/typed-emitter").Builtins>>(eventName: K, ...params: Parameters<(ExtensionEventMap & import("../shared/typed-emitter").Builtins)[K]>): void;
        once<K extends import("../shared/typed-emitter").EventKey<ExtensionEventMap & import("../shared/typed-emitter").Builtins>>(eventName: K, fn: (ExtensionEventMap & import("../shared/typed-emitter").Builtins)[K]): void;
        setMaxListeners(max: number): void;
        listenerCount(eventName: string): number;
        listeners<K extends import("../shared/typed-emitter").EventKey<ExtensionEventMap & import("../shared/typed-emitter").Builtins>>(eventName: K): (ExtensionEventMap & import("../shared/typed-emitter").Builtins)[K][];
    };
    sendMessageToBundle(messageName: string, bundleName: string, data?: unknown): void;
    readReplicant<T = unknown>(name: string, namespace: string): T | undefined;
    Replicant<V, O extends NodeCG.Replicant.Options<V> = NodeCG.Replicant.Options<V>>(name: string, namespace: string, opts: O): ServerReplicant<V, O>;
    version: any;
    declaredReplicants: Map<string, Map<string, import("../shared/replicants.shared").AbstractReplicant<"client", any>>>;
    waitForReplicants(...replicants: import("../shared/replicants.shared").AbstractReplicant<"client", any>[]): Promise<void>;
};
