import * as fs from 'node:fs';
import * as path from 'node:path';

import $RefParser from 'json-schema-lib';
import { klona as clone } from 'klona/json';
import hasha from 'hasha';

import {
	proxyRecursive,
	ignoreProxy,
	resumeProxy,
	AbstractReplicant,
	type ReplicantValue,
} from '../../shared/replicants.shared';
import formatSchema from './schema-hacks';
import createLogger from '../logger';
import type { NodeCG } from '../../types/nodecg';
import { getSchemaDefault } from '../../shared/utils';
import { NODECG_ROOT } from '../nodecg-root';

/**
 * Never instantiate this directly.
 * Always use Replicator.declare instead.
 * The Replicator needs to have complete control over the ServerReplicant class.
 */
export class ServerReplicant<
	V,
	O extends NodeCG.Replicant.Options<V> = NodeCG.Replicant.Options<V>,
> extends AbstractReplicant<'server', V, O> {
	constructor(
		name: string,
		namespace: string,
		opts: O = {} as Record<any, unknown>,
		startingValue: V | undefined = undefined,
	) {
		super(name, namespace, opts);

		/**
		 * Server Replicants are immediately considered declared.
		 * Client Replicants aren't considered declared until they have
		 * fetched the current value from the server, which is an
		 * async operation that takes time.
		 */
		this.status = 'declared';
		this.log = createLogger(`Replicant/${namespace}.${name}`);

		// If present, parse the schema and generate the validator function.
		if (opts.schemaPath) {
			const absoluteSchemaPath = path.isAbsolute(opts.schemaPath)
				? opts.schemaPath
				: path.join(NODECG_ROOT, opts.schemaPath);
			if (fs.existsSync(absoluteSchemaPath)) {
				try {
					const rawSchema = $RefParser.readSync(absoluteSchemaPath);
					const parsedSchema = formatSchema(rawSchema.root, rawSchema.rootFile, rawSchema.files);
					if (!parsedSchema) {
						throw new Error('parsed schema was unexpectedly undefined');
					}

					this.schema = parsedSchema;
					this.schemaSum = hasha(JSON.stringify(parsedSchema), { algorithm: 'sha1' });
					this.validate = this._generateValidator();
				} catch (e: any) {
					/* istanbul ignore next */
					if (!process.env.NODECG_TEST) {
						this.log.error('Schema could not be loaded, are you sure that it is valid JSON?\n', e.stack);
					}
				}
			}
		}

		let defaultValue = 'defaultValue' in opts ? opts.defaultValue : undefined;

		// Set the default value, if a schema is present and no default value was provided.
		if (this.schema && defaultValue === undefined) {
			defaultValue = getSchemaDefault(this.schema, `${this.namespace}:${this.name}`) as V;
		}

		// If `opts.persistent` is true and this replicant has a persisted value, try to load that persisted value.
		// Else, apply `defaultValue`.
		// eslint-disable-next-line @typescript-eslint/prefer-optional-chain
		if (opts.persistent && typeof startingValue !== 'undefined' && startingValue !== null) {
			if (this.validate(startingValue, { throwOnInvalid: false })) {
				this._value = proxyRecursive(this, startingValue, '/') as any;
				this.log.replicants('Loaded a persisted value:', startingValue);
			} else if (this.schema) {
				this._value = proxyRecursive(this, getSchemaDefault(this.schema, `${this.namespace}:${this.name}`), '/') as any;
				this.log.replicants(
					'Discarded persisted value, as it failed schema validation. Replaced with defaults from schema.',
				);
			}
		} else {
			if (this.schema && defaultValue !== undefined) {
				this.validate(defaultValue);
			}

			if (defaultValue === undefined) {
				this.log.replicants('Declared "%s" in namespace "%s"\n', name, namespace);
			} else {
				this._value = proxyRecursive(this, clone(defaultValue), '/') as any;
				this.log.replicants('Declared "%s" in namespace "%s" with defaultValue:\n', name, namespace, defaultValue);
			}
		}
	}

	get value(): ReplicantValue<'server', V, O> {
		return this._value as any;
	}

	set value(newValue) {
		if (newValue === this._value) {
			this.log.replicants('value unchanged, no action will be taken');
			return;
		}

		this.validate(newValue);
		this.log.replicants('running setter with', newValue);
		const clonedNewVal = clone(newValue);
		this._addOperation({
			path: '/',
			method: 'overwrite',
			args: {
				newValue: clonedNewVal,
			},
		});
		ignoreProxy(this);
		this._value = proxyRecursive(this, newValue, '/');
		resumeProxy(this);
	}

	/**
	 * Refer to the abstract base class' implementation for details.
	 * @private
	 */
	_addOperation(operation: NodeCG.Replicant.Operation<ReplicantValue<'server', V, O>>): void {
		this._operationQueue.push(operation);
		if (!this._pendingOperationFlush) {
			this._oldValue = clone(this.value);
			this._pendingOperationFlush = true;
			process.nextTick(() => {
				this._flushOperations();
			});
		}
	}

	/**
	 * Refer to the abstract base class' implementation for details.
	 * @private
	 */
	_flushOperations(): void {
		this._pendingOperationFlush = false;
		if (this._operationQueue.length <= 0) return;
		this.revision++;
		this.emit('operations', {
			name: this.name,
			namespace: this.namespace,
			operations: this._operationQueue,
			revision: this.revision,
		});
		const opQ = this._operationQueue;
		this._operationQueue = [];
		this.emit('change', this.value, this._oldValue, opQ);
	}
}
