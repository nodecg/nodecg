// Native
import * as fs from 'fs';
import * as path from 'path';

// Packages
import $RefParser from 'json-schema-lib';
import clone from 'clone';
import schemaDefaults from 'json-schema-defaults';
import sha1 from 'sha1';

// Ours
import { proxyRecursive, ignoreProxy, resumeProxy, AbstractReplicant } from '../../shared/replicants.shared';
import replaceRefs from './schema-hacks';
import createLogger from '../logger';
import type { NodeCG } from '../../types/nodecg';

// Never instantiate this directly.
// Always use Replicator.declare instead.
// The Replicator needs to have complete control over the ServerReplicant class.
export default class ServerReplicant<T> extends AbstractReplicant<T> {
	constructor(
		name: string,
		namespace: string,
		opts: NodeCG.Replicant.Options<T> = {},
		startingValue: T | undefined = undefined,
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
				: path.join(process.env.NODECG_ROOT, opts.schemaPath);
			if (fs.existsSync(absoluteSchemaPath)) {
				try {
					const rawSchema = $RefParser.readSync(absoluteSchemaPath);
					const parsedSchema = replaceRefs(rawSchema.root, rawSchema.rootFile, rawSchema.files);
					if (!parsedSchema) {
						throw new Error('parsed schema was unexpectedly undefined');
					}

					this.schema = parsedSchema;
					this.schemaSum = sha1(JSON.stringify(parsedSchema));
					this.validate = this._generateValidator();
					// eslint-disable-next-line @typescript-eslint/no-implicit-any-catch
				} catch (e) {
					/* istanbul ignore next */
					if (!process.env.NODECG_TEST) {
						this.log.error('Schema could not be loaded, are you sure that it is valid JSON?\n', e.stack);
					}
				}
			}
		}

		// Set the default value, if a schema is present and no default value was provided.
		if (this.schema && typeof opts.defaultValue === 'undefined') {
			opts.defaultValue = schemaDefaults(this.schema) as T;
		}

		// If `opts.persistent` is true and this replicant has a persisted value, try to load that persisted value.
		// Else, apply `opts.defaultValue`.
		if (opts.persistent && typeof startingValue !== 'undefined' && startingValue !== null) {
			if (this.validate(startingValue, { throwOnInvalid: false })) {
				this.value = startingValue;
				this.log.replicants('Loaded a persisted value:', startingValue);
			} else if (this.schema) {
				this.value = schemaDefaults(this.schema) as T;
				this.log.replicants(
					'Discarded persisted value, as it failed schema validation. Replaced with defaults from schema.',
				);
			}
		} else {
			if (this.schema) {
				if (typeof opts.defaultValue !== 'undefined') {
					this.validate(opts.defaultValue);
				}
			}

			this.value = clone(opts.defaultValue);
			this.log.replicants(
				'Declared "%s" in namespace "%s" with defaultValue:\n',
				name,
				namespace,
				opts.defaultValue,
			);
		}
	}

	get value(): T | undefined {
		return this._value;
	}

	set value(newValue: T | undefined) {
		if (newValue === this._value) {
			this.log.replicants('value unchanged, no action will be taken');
			return;
		}

		this.validate(newValue);
		this.log.replicants('running setter with', newValue);
		const clonedNewVal = clone(newValue);
		ignoreProxy(this);
		this._value = proxyRecursive(this, newValue, '/');
		resumeProxy(this);
		this._addOperation({
			path: '/',
			method: 'overwrite',
			args: {
				newValue: clonedNewVal,
			},
		});
	}

	/**
	 * Refer to the abstract base class' implementation for details.
	 * @private
	 */
	_addOperation(operation: NodeCG.Replicant.Operation<T>): void {
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
		this.revision++;
		this.emit('operations', {
			name: this.name,
			namespace: this.namespace,
			operations: this._operationQueue,
			revision: this.revision,
		});
		this.emit('change', this.value, this._oldValue, this._operationQueue);
		this._operationQueue = [];
	}
}
