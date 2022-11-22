// Native
import path from 'path';

// Packages
import fs from 'fs-extra';
import clone from 'clone';

// Ours
import createLogger from '../logger';
import Replicant from './server-replicant';
import { throttleName } from '../util';
import type ServerReplicant from './server-replicant';
import uuid from 'uuid';
import * as db from '../database';
import type { RootNS, TypedServerSocket, ProtocolDefinition } from '../../types/socket-protocol';
import type { NodeCG } from '../../types/nodecg';

const log = createLogger('replicator');

export default class Replicator {
	readonly replicantsRoot = path.join(process.env.NODECG_ROOT, 'db/replicants');

	readonly io: RootNS;

	readonly declaredReplicants = new Map<string, Map<string, Replicant<any>>>();

	private readonly _uuid = uuid.v4();

	private readonly _repEntities: db.Replicant[];

	private readonly _pendingSave = new WeakSet<Replicant<any>>();

	constructor(io: RootNS, repEntities: db.Replicant[]) {
		// Make 'db/replicants' folder if it doesn't exist
		if (!fs.existsSync(this.replicantsRoot)) {
			fs.mkdirpSync(this.replicantsRoot);
		}

		this.io = io;
		io.on('connection', (socket: TypedServerSocket) => {
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
	declare<T>(name: string, namespace: string, opts?: NodeCG.Replicant.Options<T>): Replicant<T> {
		// If replicant already exists, return that.
		const nsp = this.declaredReplicants.get(namespace);
		if (nsp) {
			const existing = nsp.get(name);
			if (existing) {
				existing.log.replicants('Existing replicant found, returning that instead of creating a new one.');
				return existing;
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
	applyOperations<T>(replicant: Replicant<T>, operations: Array<NodeCG.Replicant.Operation<T>>): void {
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
	emitToClients<T extends keyof ProtocolDefinition['namespaces']['/']['ServerMessages']>(
		replicant: ServerReplicant<any>,
		eventName: T,
		data: ProtocolDefinition['namespaces']['/']['ServerMessages'][T],
	): void {
		// Emit to clients (in the given namespace's room) using Socket.IO
		const namespace = `replicant:${replicant.namespace}:${replicant.name}`;
		log.replicants('emitting %s to %s:', eventName, namespace, data);
		this.io.to(namespace).emit(eventName, data);
	}

	saveAllReplicants(): void {
		for (const replicants of this.declaredReplicants.values()) {
			for (const replicant of replicants.values()) {
				this.saveReplicant(replicant);
			}
		}
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

		if (this._pendingSave.has(replicant)) {
			return;
		}

		this._pendingSave.add(replicant);

		try {
			let repEnt: db.Replicant;
			const { manager } = await db.getConnection();
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

			let value = JSON.stringify(replicant.value);
			if (typeof value === 'undefined') {
				value = '';
			}

			repEnt.value = value;
			await manager.save(repEnt);
		} catch (error: unknown) {
			replicant.log.error('Failed to persist value:', error);
		} finally {
			this._pendingSave.delete(replicant);
		}
	}

	private _attachToSocket(socket: TypedServerSocket): void {
		socket.on('replicant:declare', (data, cb) => {
			log.replicants('received replicant:declare', data);
			try {
				const replicant = this.declare(data.name, data.namespace, data.opts);
				cb(null, {
					value: replicant.value,
					revision: replicant.revision,
					schema: replicant.schema,
					schemaSum: replicant.schemaSum,
				});
				// eslint-disable-next-line @typescript-eslint/no-implicit-any-catch
			} catch (e) {
				if (e.message.startsWith('Invalid value rejected for replicant')) {
					cb(e.message);
				} else {
					// eslint-disable-next-line @typescript-eslint/no-throw-literal
					throw e;
				}
			}
		});

		socket.on('replicant:proposeOperations', (data, cb) => {
			log.replicants('received replicant:proposeOperations', data);
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
			log.replicants('replicant:read', data);
			const replicant = this.declare(data.name, data.namespace);
			if (typeof cb === 'function') {
				if (replicant) {
					cb(null, replicant.value);
				} else {
					cb(null);
				}
			}
		});
	}
}
