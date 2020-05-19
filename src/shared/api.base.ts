/* eslint-disable no-dupe-class-members */
/* eslint-disable @typescript-eslint/no-var-requires */
// Ours
// @ts-ignore
const { version } = require('../../package.json');
import { AbstractReplicant } from './replicants.shared';
import { NodeCG } from '../types/nodecg';

export type AbstractLogger = {
	name: string;
	trace: (...args: any[]) => void;
	debug: (...args: any[]) => void;
	info: (...args: any[]) => void;
	warn: (...args: any[]) => void;
	error: (...args: any[]) => void;
	replicants: (...args: any[]) => void;
};

export interface HandledAcknowledgement {
	handled: true;
}

export interface UnhandledAcknowledgement {
	handled: false;
	(err?: any, response?: unknown): void;
}

export type Acknowledgement = HandledAcknowledgement | UnhandledAcknowledgement;

export type ListenFunc = (data: unknown, ack?: Acknowledgement) => void;

type MessageHandler = {
	messageName: string;
	bundleName: string;
	func: ListenFunc;
};

export abstract class NodeCGAPIBase {
	static version = version;

	/**
	 * An object containing references to all Replicants that have been declared in this `window`, sorted by bundle.
	 * E.g., `NodeCG.declaredReplicants.myBundle.myRep`
	 */
	static declaredReplicants: Map<string, Map<string, AbstractReplicant<any>>>;

	/**
	 * The name of the bundle which this NodeCG API instance is for.
	 */
	readonly bundleName: string;

	/**
	 * An object containing the parsed content of `cfg/<bundle-name>.json`, the contents of which
	 * are read once when NodeCG starts up. Used to quickly access per-bundle configuration properties.
	 */
	readonly bundleConfig: Readonly<{ [k: string]: unknown }>; // TODO: type this better

	/**
	 * The version (from package.json) of the bundle which this NodeCG API instance is for.
	 * @name NodeCG#bundleVersion
	 */
	readonly bundleVersion: string;

	/**
	 * Provides information about the current git status of this bundle, if found.
	 */
	readonly bundleGit: Readonly<NodeCG.Bundle.GitData>;

	_messageHandlers: MessageHandler[] = [];

	/**
	 * Since the process of instantiating a Replicant is quite different on
	 * the client and server, this abstract class relies on its child classes
	 * to define this method that handles this context-specific logic.
	 */
	protected abstract readonly _replicantFactory: <T>(
		name: string,
		namespace: string,
		opts: NodeCG.Replicant.Options<T>,
	) => AbstractReplicant<T>;

	/**
	 * Provides easy access to the Logger class.
	 * Useful in cases where you want to create your own custom logger.
	 */
	abstract get Logger(): new (name: string) => AbstractLogger;

	/**
	 * An instance of NodeCG's Logger, with the following methods. The logging level is set in `cfg/nodecg.json`,
	 * NodeCG's global config file.
	 * ```
	 * nodecg.log.trace('trace level logging');
	 * nodecg.log.debug('debug level logging');
	 * nodecg.log.info('info level logging');
	 * nodecg.log.warn('warn level logging');
	 * nodecg.log.error('error level logging');
	 * ```
	 */
	abstract get log(): AbstractLogger;

	/**
	 * A filtered copy of the NodeCG server config with some sensitive keys removed.
	 */
	abstract get config(): Readonly<NodeCG.FilteredConfig>;

	constructor(bundle: NodeCG.Bundle) {
		this.bundleName = bundle.name;
		this.bundleConfig = bundle.config;
		this.bundleVersion = bundle.version;
		this.bundleGit = bundle.git;
	}

	/**
	 * Lets you easily wait for a group of Replicants to finish declaring.
	 *
	 * Returns a promise which is resolved once all provided Replicants
	 * have emitted a `change` event, which is indicates that they must
	 * have finished declaring.
	 *
	 * This method is only useful in client-side code.
	 * Server-side code never has to wait for Replicants.
	 *
	 * @param replicants {Replicant}
	 * @returns {Promise<any>}
	 *
	 * @example <caption>From a graphic or dashboard panel:</caption>
	 * const rep1 = nodecg.Replicant('rep1');
	 * const rep2 = nodecg.Replicant('rep2');
	 *
	 * // You can provide as many Replicant arguments as you want,
	 * // this example just uses two Replicants.
	 * NodeCG.waitForReplicants(rep1, rep2).then(() => {
	 *     console.log('rep1 and rep2 are fully declared and ready to use!');
	 * });
	 */
	static async waitForReplicants(...replicants: Array<AbstractReplicant<any>>): Promise<void> {
		return new Promise(resolve => {
			const numReplicants = replicants.length;
			let declaredReplicants = 0;
			replicants.forEach(replicant => {
				replicant.once('change', () => {
					declaredReplicants++;
					if (declaredReplicants >= numReplicants) {
						resolve();
					}
				});
			});
		});
	}

	/**
	 * Listens for a message, and invokes the provided callback each time the message is received.
	 * If any data was sent with the message, it will be passed to the callback.
	 *
	 * Messages are namespaced by bundle.
	 * To listen to a message in another bundle's namespace, provide it as the second argument.
	 *
	 * You may define multiple listenFor handlers for a given message.
	 * They will be called in the order they were registered.
	 *
	 * @example
	 * nodecg.listenFor('printMessage', message => {
	 *     console.log(message);
	 * });
	 *
	 * @example <caption>Listening to a message in another bundle's namespace:</caption>
	 * nodecg.listenFor('printMessage', 'another-bundle', message => {
	 *     console.log(message);
	 * });
	 */
	listenFor(messageName: string, handlerFunc: ListenFunc): void;
	listenFor(messageName: string, bundleName: string, handlerFunc: ListenFunc): void;
	listenFor(messageName: string, bundleNameOrHandlerFunc: string | ListenFunc, handlerFunc?: ListenFunc): void {
		let bundleName: string;
		if (typeof bundleNameOrHandlerFunc === 'string') {
			bundleName = bundleNameOrHandlerFunc;
		} else {
			bundleName = this.bundleName;
			handlerFunc = bundleNameOrHandlerFunc;
		}

		if (typeof handlerFunc !== 'function') {
			throw new Error(`argument "handler" must be a function, but you provided a(n) ${typeof handlerFunc}`);
		}

		this.log.trace('Listening for %s from bundle %s', messageName, bundleNameOrHandlerFunc);
		this._messageHandlers.push({
			messageName,
			bundleName,
			func: handlerFunc,
		});
	}

	/**
	 * Removes a listener for a message.
	 *
	 * Messages are namespaced by bundle.
	 * To remove a listener to a message in another bundle's namespace, provide it as the second argument.
	 *
	 * @param {string} messageName - The name of the message.
	 * @param {string} [bundleName=CURR_BNDL] - The bundle namespace to in which to listen for this message
	 * @param {function} handlerFunc - A reference to a handler function added as a listener to this message via {@link NodeCG#listenFor}.
	 * @returns {boolean}
	 *
	 * @example
	 * nodecg.unlisten('printMessage', someFunctionName);
	 *
	 * @example <caption>Removing a listener from a message in another bundle's namespace:</caption>
	 * nodecg.unlisten('printMessage', 'another-bundle', someFunctionName);
	 */
	unlisten(messageName: string, handlerFunc: ListenFunc): boolean;
	unlisten(messageName: string, bundleNameOrHandler: string | ListenFunc, maybeHandler?: ListenFunc): boolean {
		let bundleName = this.bundleName;
		let handlerFunc = maybeHandler;
		if (typeof bundleNameOrHandler === 'string') {
			bundleName = bundleNameOrHandler;
		} else {
			handlerFunc = bundleNameOrHandler;
		}

		if (typeof handlerFunc !== 'function') {
			throw new Error(`argument "handler" must be a function, but you provided a(n) ${typeof handlerFunc}`);
		}

		this.log.trace('[%s] Removing listener for %s from bundle %s', this.bundleName, messageName, bundleName);

		// Find the index of this handler in the array.
		const index = this._messageHandlers.findIndex(handler => {
			return (
				handler.messageName === messageName && handler.bundleName === bundleName && handler.func === handlerFunc
			);
		});

		// If the handler exists, remove it and return true.
		if (index >= 0) {
			this._messageHandlers.splice(index, 1);
			return true;
		}

		// Else, return false.
		return false;
	}

	/**
	 * Replicants are objects which monitor changes to a variable's value.
	 * The changes are replicated across all extensions, graphics, and dashboard panels.
	 * When a Replicant changes in one of those places it is quickly updated in the rest,
	 * and a `change` event is emitted allowing bundles to react to the changes in the data.
	 *
	 * If a Replicant with a given name in a given bundle namespace has already been declared,
	 * the Replicant will automatically be assigned the existing value.
	 *
	 * Replicants must be declared in each context that wishes to use them. For instance,
	 * declaring a replicant in an extension does not automatically make it available in a graphic.
	 * The graphic must also declare it.
	 *
	 * By default Replicants will be saved to disk, meaning they will automatically be restored when NodeCG is restarted,
	 * such as after an unexpected crash.
	 * If you need to opt-out of this behaviour simply set `persistent: false` in the `opts` argument.
	 *
	 * As of NodeCG 0.8.4, Replicants can also be automatically validated against a JSON Schema that you provide.
	 * See {@tutorial replicant-schemas} for more information.
	 *
	 * @param {string} name - The name of the replicant.
	 * @param {string} [namespace] - The namespace to in which to look for this replicant. Defaults to the name of the current bundle.
	 * @param {object} [opts] - The options for this replicant.
	 * @param {*} [opts.defaultValue] - The default value to instantiate this Replicant with. The default value is only
	 * applied if this Replicant has not previously been declared and if it has no persisted value.
	 * @param {boolean} [opts.persistent=true] - Whether to persist the Replicant's value to disk on every change.
	 * Persisted values are re-loaded on startup.
	 * @param {number} [opts.persistenceInterval=DEFAULT_PERSISTENCE_INTERVAL] - Interval between each persistence, in milliseconds.
	 * @param {string} [opts.schemaPath] - The filepath at which to look for a JSON Schema for this Replicant.
	 * Defaults to `nodecg/bundles/${bundleName}/schemas/${replicantName}.json`. Please note that this default
	 * path will be URIEncoded to ensure that it results in a valid filename.
	 *
	 * @example
	 * const myRep = nodecg.Replicant('myRep', {defaultValue: 123});
	 *
	 * myRep.on('change', (newValue, oldValue) => {
	 *     console.log(`myRep changed from ${oldValue} to ${newValue}`);
	 * });
	 *
	 * myRep.value = 'Hello!';
	 * myRep.value = {objects: 'work too!'};
	 * myRep.value = {objects: {can: {be: 'nested!'}}};
	 * myRep.value = ['Even', 'arrays', 'work!'];
	 */
	Replicant<T>(name: string, namespace: string, opts?: NodeCG.Replicant.Options<T>): AbstractReplicant<T>;
	Replicant<T>(name: string, opts?: NodeCG.Replicant.Options<T>): AbstractReplicant<T>;
	Replicant<T>(
		name: string,
		namespaceOrOpts?: string | NodeCG.Replicant.Options<T>,
		opts?: NodeCG.Replicant.Options<T>,
	): AbstractReplicant<T> {
		let namespace: string;
		if (typeof namespaceOrOpts === 'string') {
			namespace = namespaceOrOpts;
		} else {
			namespace = this.bundleName;
		}

		if (typeof namespaceOrOpts !== 'string') {
			opts = namespaceOrOpts;
		}

		opts = opts ?? {};
		if (typeof opts.schemaPath === 'undefined') {
			opts.schemaPath = `bundles/${encodeURIComponent(namespace)}/schemas/${encodeURIComponent(name)}.json`;
		}

		return this._replicantFactory(name, namespace, opts);
	}
}
