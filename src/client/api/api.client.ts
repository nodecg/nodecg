// Ours
import type { AbstractLogger } from '../../shared/api.base';
import { NodeCGAPIBase } from '../../shared/api.base';
import ClientReplicant from './replicant';
import { filteredConfig } from './config';
import { Logger } from './logger';
import type { TypedClientSocket } from '../../types/socket-protocol';
import type { NodeCG } from '../../types/nodecg';

type SendMessageCb = (error?: unknown, response?: unknown) => void;

type ReadReplicantCb = (value: unknown) => void;

const soundMetadata = new WeakMap<createjs.AbstractSoundInstance, { cueName: string; updateVolume: boolean }>();
const apiContexts = new Set<NodeCGAPIClient>();

/**
 * This is what enables intra-context messaging.
 * I.e., passing messages from one extension to another in the same Node.js context.
 */
function _forwardMessageToContext(messageName: string, bundleName: string, data: unknown): void {
	setTimeout(() => {
		apiContexts.forEach((ctx) => {
			ctx._messageHandlers.forEach((handler) => {
				if (messageName === handler.messageName && bundleName === handler.bundleName) {
					handler.func(data);
				}
			});
		});
	}, 0);
}

export class NodeCGAPIClient extends NodeCGAPIBase {
	static Replicant<T>(name: string, namespace: string, opts: NodeCG.Replicant.Options<T> = {}): ClientReplicant<T> {
		return new ClientReplicant<T>(name, namespace, opts, (window as any).socket);
	}

	static sendMessageToBundle(messageName: string, bundleName: string, cb: SendMessageCb): void;
	static sendMessageToBundle(messageName: string, bundleName: string, data?: unknown): Promise<unknown>;
	static sendMessageToBundle(messageName: string, bundleName: string, data: unknown, cb: SendMessageCb): void;
	static sendMessageToBundle(
		messageName: string,
		bundleName: string,
		dataOrCb?: unknown,
		cb?: SendMessageCb,
	): void | Promise<unknown> {
		let data: any = null;
		if (typeof dataOrCb === 'function') {
			cb = dataOrCb as SendMessageCb;
		} else {
			data = dataOrCb;
		}

		_forwardMessageToContext(messageName, bundleName, data);

		if (typeof cb === 'function') {
			window.socket.emit(
				'message',
				{
					bundleName,
					messageName,
					content: data,
				},
				(err: any, response: any) => {
					cb!(err, response);
				},
			);
		} else {
			return new Promise<any[]>((resolve, reject) => {
				window.socket.emit(
					'message',
					{
						bundleName,
						messageName,
						content: data,
					},
					(err: any, response: any) => {
						if (err) {
							reject(err);
						} else {
							resolve(response);
						}
					},
				);
			});
		}
	}
	/* eslint-enable no-dupe-class-members */

	static readReplicant(name: string, namespace: string, cb: ReadReplicantCb): void {
		window.socket.emit('replicant:read', { name, namespace }, (error, value) => {
			if (error) {
				console.error(error);
			} else {
				cb(value);
			}
		});
	}

	get Logger(): new (name: string) => AbstractLogger {
		return Logger;
	}

	get log(): AbstractLogger {
		if (this._memoizedLogger) {
			return this._memoizedLogger;
		}

		this._memoizedLogger = new Logger(this.bundleName);
		return this._memoizedLogger;
	}

	get config(): typeof filteredConfig {
		return Object.freeze(JSON.parse(JSON.stringify(filteredConfig)));
	}

	readonly socket: TypedClientSocket;

	soundsReady = false;

	private readonly _soundFiles: ClientReplicant<NodeCG.AssetFile[]>;

	private readonly _bundleVolume: ClientReplicant<number>;

	private readonly _masterVolume: ClientReplicant<number>;

	private _soundCues: NodeCG.SoundCue[] = [];

	private _memoizedLogger?: AbstractLogger;

	constructor(bundle: NodeCG.Bundle & { _hasSounds?: boolean }, socket: TypedClientSocket) {
		super(bundle);
		apiContexts.add(this);

		// If title isn't set, set it to the bundle name
		document.addEventListener(
			'DOMContentLoaded',
			() => {
				if (document.title === '') {
					document.title = this.bundleName;
				}
			},
			false,
		);

		// Make socket accessible to public methods
		this.socket = socket;
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		this.socket.emit('joinRoom', bundle.name, () => {});

		if (bundle._hasSounds && window.createjs && window.createjs.Sound) {
			const soundCuesRep = new ClientReplicant<NodeCG.SoundCue[]>('soundCues', this.bundleName, {}, socket);
			this._soundFiles = new ClientReplicant<NodeCG.AssetFile[]>('assets:sounds', this.bundleName, {}, socket);
			this._bundleVolume = new ClientReplicant<number>(`volume:${this.bundleName}`, '_sounds', {}, socket);
			this._masterVolume = new ClientReplicant<number>('volume:master', '_sounds', {}, socket);

			this._soundCues = [];

			const loadedSums = new Set();
			window.createjs.Sound.on('fileload', (e: any) => {
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
					window.dispatchEvent(new CustomEvent('ncgSoundsReady'));
				}
			});

			const handleAnyCuesRepChange = (): void => {
				this._soundCues = soundCuesRep.value ?? [];
				this._updateInstanceVolumes();
				this._registerSounds();
			};

			soundCuesRep.on('change', handleAnyCuesRepChange);

			this._soundFiles.on('change', () => this._registerSounds.bind(this));
			this._bundleVolume.on('change', () => this._updateInstanceVolumes.bind(this));
			this._masterVolume.on('change', () => this._updateInstanceVolumes.bind(this));
		}

		// Upon receiving a message, execute any handlers for it
		socket.on('message', (data) => {
			this.log.trace(
				'Received message %s (sent to bundle %s) with data:',
				data.messageName,
				data.bundleName,
				data.content,
			);

			this._messageHandlers.forEach((handler) => {
				if (data.messageName === handler.messageName && data.bundleName === handler.bundleName) {
					handler.func(data.content);
				}
			});
		});

		socket.on('error', (err) => {
			this.log.warn('Unhandled socket connection error:', err);
		});

		socket.on('protocol_error', (err) => {
			if (err.type === 'UnauthorizedError') {
				const url = [location.protocol, '//', location.host, location.pathname].join('');
				window.location.href = `/authError?code=${err.code as string}&message=${err.message}&viewUrl=${url}`;
			} else {
				this.log.error('Unhandled socket protocol error:', err);
			}
		});
	}

	/**
	 * _Browser only_<br/>
	 * Returns the specified dialog element.
	 * @param {string} name - The desired dialog's name.
	 * @param {string} [bundle=CURR_BNDL] - The bundle from which to select the dialog.
	 * @returns {object}
	 */
	getDialog(name: string, bundle?: string): HTMLElement | undefined {
		bundle = bundle ?? this.bundleName;
		const topDoc = window.top?.document;
		if (!topDoc) {
			return undefined;
		}

		const dialog = topDoc.querySelector('ncg-dashboard')?.shadowRoot?.querySelector(`#dialogs #${bundle}_${name}`);
		return (dialog as HTMLElement) ?? undefined;
	}

	/**
	 * _Browser only_<br/>
	 * Returns the specified dialog's iframe document.
	 * @param {string} name - The desired dialog's name.
	 * @param {string} [bundle=CURR_BNDL] - The bundle from which to select the dialog.
	 * @returns {object}
	 */
	getDialogDocument(name: string, bundle?: string): Document | undefined {
		bundle = bundle ?? this.bundleName;
		return this.getDialog(name, bundle)?.querySelector('iframe')?.contentWindow?.document;
	}

	/**
	 * Returns the sound cue of the provided `cueName` in the current bundle.
	 * Returns undefined if a cue by that name cannot be found in this bundle.
	 */
	findCue(cueName: string): NodeCG.SoundCue | undefined {
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
	playSound(
		cueName: string,
		{ updateVolume = true }: { updateVolume: boolean } = { updateVolume: true },
	): createjs.AbstractSoundInstance | undefined {
		if (!this._soundCues) {
			throw new Error(`Bundle "${this.bundleName}" has no soundCues`);
		}

		const cue = this.findCue(cueName);
		if (!cue) {
			throw new Error(`Cue "${cueName}" does not exist in bundle "${this.bundleName}"`);
		}

		if (!window.createjs || !window.createjs.Sound) {
			throw new Error("NodeCG Sound API methods are not available when SoundJS isn't present");
		}

		if (!cue.file) {
			return;
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
	stopSound(cueName: string): void {
		if (!this._soundCues) {
			throw new Error(`Bundle "${this.bundleName}" has no soundCues`);
		}

		if (!this._soundCues.find((cue) => cue.name === cueName)) {
			throw new Error(`Cue "${cueName}" does not exist in bundle "${this.bundleName}"`);
		}

		if (!window.createjs || !window.createjs.Sound) {
			throw new Error("NodeCG Sound API methods are not available when SoundJS isn't present");
		}

		const instancesArr = (window.createjs.Sound as any)._instances as createjs.AbstractSoundInstance[];
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
	stopAllSounds(): void {
		if (!window.createjs || !window.createjs.Sound) {
			throw new Error("NodeCG Sound API methods are not available when SoundJS isn't present");
		}

		window.createjs.Sound.stop();
	}

	sendMessageToBundle(messageName: string, bundleName: string, cb: SendMessageCb): void;
	sendMessageToBundle(messageName: string, bundleName: string, data?: unknown): Promise<unknown>;
	sendMessageToBundle(messageName: string, bundleName: string, data: unknown, cb: SendMessageCb): void;
	sendMessageToBundle(
		messageName: string,
		bundleName: string,
		dataOrCb?: unknown,
		cb?: SendMessageCb,
	): void | Promise<unknown> {
		// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
		return NodeCGAPIClient.sendMessageToBundle(messageName, bundleName, dataOrCb, cb as any);
	}

	sendMessage(messageName: string, cb: SendMessageCb): void;
	sendMessage(messageName: string, data?: unknown): Promise<unknown>;
	sendMessage(messageName: string, data: unknown, cb: SendMessageCb): void;
	sendMessage(messageName: string, dataOrCb?: unknown, cb?: SendMessageCb): void | Promise<unknown> {
		// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
		return this.sendMessageToBundle(messageName, this.bundleName, dataOrCb, cb as any);
	}

	readReplicant(name: string, cb: ReadReplicantCb): void;
	readReplicant(name: string, namespace: string, cb: ReadReplicantCb): void;
	readReplicant(name: string, nspOrCb: string | ReadReplicantCb, maybeCb?: ReadReplicantCb): void {
		let namespace = this.bundleName;
		let cb: ReadReplicantCb;
		if (typeof nspOrCb === 'string') {
			namespace = nspOrCb;
			cb = maybeCb!;
		} else {
			cb = nspOrCb;
		}

		NodeCGAPIClient.readReplicant(name, namespace, cb);
	}
	/* eslint-enable no-dupe-class-members */

	protected _replicantFactory = <T>(
		name: string,
		namespace: string,
		opts: NodeCG.Replicant.Options<T>,
	): ClientReplicant<T> => new ClientReplicant<T>(name, namespace, opts, this.socket);

	private _registerSounds(): void {
		this._soundCues.forEach((cue) => {
			if (!cue.file) {
				return;
			}

			window.createjs.Sound.registerSound(`${cue.file.url}?sum=${cue.file.sum}`, cue.name, {
				channels: typeof cue.channels === 'undefined' ? 100 : cue.channels,
				sum: cue.file.sum,
			});
		});
	}

	private _setInstanceVolume(instance: createjs.AbstractSoundInstance, cue: NodeCG.SoundCue): void {
		if (
			this._masterVolume.status !== 'declared' ||
			typeof this._masterVolume.value !== 'number' ||
			this._bundleVolume.status !== 'declared' ||
			typeof this._bundleVolume.value !== 'number'
		) {
			return;
		}

		const volume = (this._masterVolume.value / 100) * (this._bundleVolume.value / 100) * (cue.volume / 100);
		// Volue value must be finite or SoundJS throws error
		instance.volume = isFinite(volume) ? volume : 0;
	}

	private _updateInstanceVolumes(): void {
		const instancesArr = (window.createjs.Sound as any)._instances as createjs.AbstractSoundInstance[];

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

(window as any).NodeCG = NodeCGAPIClient;