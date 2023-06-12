// Packages
import { klona as clone } from 'klona/json';

// Ours
import createLogger from '../logger';
import Replicant from './server-replicant';
import { throttleName } from '../util';
import type ServerReplicant from './server-replicant';
import * as uuid from 'uuid';
import * as db from '../database';
import type { TypedServerSocket, ServerToClientEvents, RootNS } from '../../types/socket-protocol';
import type { NodeCG } from '../../types/nodecg';
import { stringifyError } from '../../shared/utils';
import type { EntityManager } from 'typeorm';

const log = createLogger('replicator');

export default class Replicator {
	readonly declaredReplicants = new Map<string, Map<string, Replicant<any>>>();

	private readonly _uuid = uuid.v4();

	private readonly _repEntities: db.Replicant[];

	private readonly _pendingSave = new WeakMap<Replicant<any>, Promise<any>>();

	constructor(public readonly io: RootNS, repEntities: db.Replicant[]) {
		this.io = io;
		io.on('connection', (socket) => {
			this._attachToSocket(socket);
		});

		this._repEntities = repEntities;
	}

	/**
	 * Declares a Replicant.
	 * @param {string} name - The name of the Replicant to declare.
	 * @param {string} namespace - The namespace to which this Replicant belongs.
	 * @param {object} [opts] - The options for this replicant.
	 * @param {*} [opts.defaultValue] - The default value to instantiate this Replicant with. The default value is only
	 * applied if this Replicant has not previously been declared and if it has no persisted value.
	 * @param {boolean} [opts.persistent=true] - Whether to persist the Replicant's value to disk on every change.
	 * Persisted values are re-loaded on startup.
	 * @param {string} [opts.schemaPath] - The filepath at which to look for a JSON Schema for this Replicant.
	 * Defaults to `nodecg/bundles/${bundleName}/schemas/${replicantName}.json`.
	 * @returns {object}
	 */
	declare<V, O extends NodeCG.Replicant.OptionsWithDefault<V> = NodeCG.Replicant.OptionsWithDefault<V>>(
		name: string,
		namespace: string,
		opts?: O,
	): Replicant<V, O>;
	declare<V, O extends NodeCG.Replicant.OptionsNoDefault = NodeCG.Replicant.OptionsNoDefault>(
		name: string,
		namespace: string,
		opts?: O,
	): Replicant<V, O>;
	declare<V, O extends NodeCG.Replicant.Options<V> = NodeCG.Replicant.Options<V>>(
		name: string,
		namespace: string,
		opts?: O,
	): Replicant<V, O> {
		// If replicant already exists, return that.
		const nsp = this.declaredReplicants.get(namespace);
		if (nsp) {
			const existing = nsp.get(name);
			if (existing) {
				existing.log.replicants('Existing replicant found, returning that instead of creating a new one.');
				return existing as any;
			}
		} else {
			this.declaredReplicants.set(namespace, new Map());
		}

		// Look up the persisted value, if any.
		let parsedPersistedValue;
		const repEnt = this._repEntities.find((re) => re.namespace === namespace && re.name === name);
		if (repEnt) {
			try {
				parsedPersistedValue = repEnt.value === '' ? undefined : JSON.parse(repEnt.value);
			} catch (_: unknown) {
				parsedPersistedValue = repEnt.value;
			}
		}

		// Make the replicant and add it to the declaredReplicants map
		const rep = new Replicant(name, namespace, opts, parsedPersistedValue);
		this.declaredReplicants.get(namespace)!.set(name, rep);

		// Add persistence hooks
		rep.on('change', () => {
			this.saveReplicant(rep);
		});

		// Listen for server-side operations
		rep.on('operations', (data) => {
			this.emitToClients(rep, 'replicant:operations', data);
		});

		return rep;
	}

	/**
	 * Applies an array of operations to a replicant.
	 * @param replicant {object} - The Replicant to perform these operation on.
	 * @param operations {array} - An array of operations.
	 */
	applyOperations<V>(
		replicant: Replicant<V, NodeCG.Replicant.Options<V>>,
		operations: Array<NodeCG.Replicant.Operation<V>>,
	): void {
		const oldValue = clone(replicant.value);
		operations.forEach((operation) => replicant._applyOperation(operation));
		replicant.revision++;
		replicant.emit('change', replicant.value, oldValue, operations);
		this.emitToClients(replicant, 'replicant:operations', {
			name: replicant.name,
			namespace: replicant.namespace,
			revision: replicant.revision,
			operations,
		});
	}

	/**
	 * Emits an event to all remote Socket.IO listeners.
	 * @param namespace - The namespace in which to emit this event. Only applies to Socket.IO listeners.
	 * @param eventName - The name of the event to emit.
	 * @param data - The data to emit with the event.
	 */
	emitToClients<T extends keyof ServerToClientEvents>(
		replicant: ServerReplicant<any>,
		eventName: T,
		data: Parameters<ServerToClientEvents[T]>[0],
	): void {
		// Emit to clients (in the given namespace's room) using Socket.IO
		const namespace = `replicant:${replicant.namespace}:${replicant.name}`;
		log.replicants('emitting %s to %s:', eventName, namespace, JSON.stringify(data, undefined, 2));
		(this.io as any).to(namespace).emit(eventName, data); // TODO: figure out how to type this properly
	}

	saveAllReplicants(): void {
		for (const replicants of this.declaredReplicants.values()) {
			for (const replicant of replicants.values()) {
				this.saveReplicant(replicant);
			}
		}
	}

	async saveAllReplicantsNow(): Promise<void> {
		const promises: Array<Promise<void>> = [];
		for (const replicants of this.declaredReplicants.values()) {
			for (const replicant of replicants.values()) {
				promises.push(this._saveReplicant(replicant));
			}
		}

		await Promise.all(promises);
	}

	saveReplicant(replicant: ServerReplicant<any>): void {
		if (!replicant.opts.persistent) {
			return;
		}

		throttleName(
			`${this._uuid}:${replicant.namespace}:${replicant.name}`,
			() => {
				this._saveReplicant(replicant).catch((error) => {
					log.error('Error saving replicant:', error);
				});
			},
			replicant.opts.persistenceInterval,
		);
	}

	private async _saveReplicant(replicant: ServerReplicant<any>): Promise<void> {
		if (!replicant.opts.persistent) {
			return;
		}

		let databaseSaveInProgress = false;
		let valueChangedDuringSave = false;

		// Return the promise so that it can still be awaited
		if (this._pendingSave.has(replicant)) {
			return this._pendingSave.get(replicant);
		}

		try {
			const promise = new Promise<EntityManager>((resolve, reject) => {
				db.getConnection()
					.then((db) => {
						resolve(db.manager);
					})
					.catch(reject);
				// eslint-disable-next-line @typescript-eslint/promise-function-async
			}).then((manager) => {
				let repEnt: db.Replicant;
				const exitingEnt = this._repEntities.find(
					(pv) => pv.namespace === replicant.namespace && pv.name === replicant.name,
				);
				if (exitingEnt) {
					repEnt = exitingEnt;
				} else {
					repEnt = manager.create(db.Replicant, {
						namespace: replicant.namespace,
						name: replicant.name,
					});
					this._repEntities.push(repEnt);
				}

				return new Promise<void>((resolve, reject) => {
					const valueRef = replicant.value;
					let serializedValue = JSON.stringify(valueRef);
					if (typeof serializedValue === 'undefined') {
						serializedValue = '';
					}

					const changeHandler = (newVal: unknown) => {
						if (newVal !== valueRef && !isNaN(valueRef)) {
							valueChangedDuringSave = true;
						}
					};

					repEnt.value = serializedValue;
					databaseSaveInProgress = true;
					replicant.on('change', changeHandler);
					manager
						.save(repEnt)
						.then(
							// eslint-disable-next-line @typescript-eslint/promise-function-async
							() =>
								new Promise<void>((resolve, reject) => {
									if (!valueChangedDuringSave) {
										resolve();
										return;
									}

									// If we are here, then that means the value changed again during
									// the save operation, and so we have to do some recursion
									// to save it again.
									this._pendingSave.delete(replicant);
									this._saveReplicant(replicant).then(resolve).catch(reject);
								}),
						)
						.then(() => {
							resolve();
						})
						.catch(reject)
						.finally(() => {
							databaseSaveInProgress = false;
							replicant.off('change', changeHandler);
						});
				});
			});
			this._pendingSave.set(replicant, promise);
			await promise;
		} catch (error: unknown) {
			replicant.log.error('Failed to persist value:', stringifyError(error));
		} finally {
			this._pendingSave.delete(replicant);
		}
	}

	private _attachToSocket(socket: TypedServerSocket): void {
		socket.on('replicant:declare', (data, cb) => {
			log.replicants('received replicant:declare', JSON.stringify(data, undefined, 2));
			try {
				const replicant = this.declare(data.name, data.namespace, data.opts);
				cb(undefined, {
					value: replicant.value,
					revision: replicant.revision,
					schema: replicant.schema,
					schemaSum: replicant.schemaSum,
				});
				// eslint-disable-next-line @typescript-eslint/no-implicit-any-catch
			} catch (e: any) {
				if (e.message.startsWith('Invalid value rejected for replicant')) {
					cb(e.message, undefined);
				} else {
					// eslint-disable-next-line @typescript-eslint/no-throw-literal
					throw e;
				}
			}
		});

		socket.on('replicant:proposeOperations', (data, cb) => {
			log.replicants('received replicant:proposeOperations', JSON.stringify(data, undefined, 2));
			const serverReplicant = this.declare(data.name, data.namespace, data.opts);
			if (serverReplicant.schema && (!('schemaSum' in data) || data.schemaSum !== serverReplicant.schemaSum)) {
				log.replicants(
					'Change request %s:%s had mismatched schema sum (ours %s, theirs %s), invoking callback with new schema and fullupdate',
					data.namespace,
					data.name,
					serverReplicant.schemaSum,
					'schemaSum' in data ? data.schemaSum : '(no schema)',
				);
				cb('Mismatched schema version, assignment rejected', {
					schema: serverReplicant.schema,
					schemaSum: serverReplicant.schemaSum,
					value: serverReplicant.value,
					revision: serverReplicant.revision,
				});
			} else if (serverReplicant.revision !== data.revision) {
				log.replicants(
					'Change request %s:%s had mismatched revision (ours %s, theirs %s), invoking callback with fullupdate',
					data.namespace,
					data.name,
					serverReplicant.revision,
					data.revision,
				);
				cb('Mismatched revision number, assignment rejected', {
					value: serverReplicant.value,
					revision: serverReplicant.revision,
				});
			}

			this.applyOperations(serverReplicant, data.operations);
		});

		socket.on('replicant:read', (data, cb) => {
			log.replicants('replicant:read', JSON.stringify(data, undefined, 2));
			const replicant = this.declare(data.name, data.namespace);
			if (typeof cb === 'function') {
				if (replicant) {
					cb(undefined, replicant.value);
				} else {
					cb(undefined, undefined);
				}
			}
		});
	}
}
