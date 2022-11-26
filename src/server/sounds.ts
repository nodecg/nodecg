// Native
import path from 'path';

// Packages
import clone from 'clone';
import express from 'express';
import sha1File from 'sha1-file';
import appRootPath from 'app-root-path';

// Ours
import type { Replicator } from './replicant';
import type ServerReplicant from './replicant/server-replicant';
import { sendFile } from './util';
import type { NodeCG } from '../types/nodecg';

export default class SoundsLib {
	app = express();

	private readonly _bundles: NodeCG.Bundle[];

	private readonly _cueRepsByBundle = new Map<string, ServerReplicant<NodeCG.SoundCue[]>>();

	constructor(bundles: NodeCG.Bundle[], replicator: Replicator) {
		this._bundles = bundles;

		// Create the replicant for the "Master Fader"
		replicator.declare('volume:master', '_sounds', { defaultValue: 100 });

		bundles.forEach((bundle) => {
			// If this bundle has sounds
			if (bundle.soundCues.length > 0) {
				// Create an array replicant that will hold all this bundle's sound cues.
				const defaultCuesRepValue = this._makeCuesRepDefaultValue(bundle);

				const cuesRep = replicator.declare<NodeCG.SoundCue[]>('soundCues', bundle.name, {
					schemaPath: path.resolve(appRootPath.path, 'schemas/soundCues.json'),
					defaultValue: [],
				});

				this._cueRepsByBundle.set(bundle.name, cuesRep);

				if (cuesRep.value!.length > 0) {
					// Remove any persisted cues that are no longer in the bundle manifest.
					cuesRep.value = cuesRep.value!.filter((persistedCue) =>
						defaultCuesRepValue.find((defaultCue) => defaultCue.name === persistedCue.name),
					);

					// Add/update any cues in the bundle manifest that aren't in the persisted replicant.
					defaultCuesRepValue.forEach((defaultCue) => {
						const existingIndex = cuesRep.value!.findIndex(
							(persistedCue) => persistedCue.name === defaultCue.name,
						);

						// We need to just update a few key properties in the persisted cue.
						// We leave things like volume as-is.
						if (existingIndex >= 0) {
							cuesRep.value![existingIndex].assignable = defaultCue.assignable;
							cuesRep.value![existingIndex].defaultFile = defaultCue.defaultFile;

							// If we're updating the cue to not be assignable, then we have to
							// set the `defaultFile` as the selected `file`.
							if (!defaultCue.assignable && defaultCue.defaultFile) {
								cuesRep.value![existingIndex].file = clone(defaultCue.defaultFile);
							}
						} else {
							cuesRep.value!.push(defaultCue);
						}
					});
				} else {
					// There's no persisted value, so just assign the default.
					cuesRep.value = defaultCuesRepValue;
				}

				// Create this bundle's "Bundle Fader"
				replicator.declare(`volume:${bundle.name}`, '_sounds', {
					defaultValue: 100,
				});
			}
		});

		this.app.get('/sound/:bundleName/:cueName/default.mp3', this._serveDefault.bind(this));
		this.app.get('/sound/:bundleName/:cueName/default.ogg', this._serveDefault.bind(this));
	}

	private _serveDefault(req: express.Request, res: express.Response, next: express.NextFunction): void {
		const bundle = this._bundles.find((b) => b.name === req.params.bundleName);
		if (!bundle) {
			res.status(404).send(`File not found: ${req.path}`);
			return;
		}

		const cue = bundle.soundCues.find((cue) => cue.name === req.params.cueName);
		if (!cue) {
			res.status(404).send(`File not found: ${req.path}`);
			return;
		}

		if (!cue.defaultFile) {
			res.status(404).send(`Cue "${cue.name}" had no default file`);
			return;
		}

		const fullPath = path.join(bundle.dir, cue.defaultFile);
		sendFile(fullPath, res, next);
	}

	private _makeCuesRepDefaultValue(bundle: NodeCG.Bundle): NodeCG.SoundCue[] {
		const formattedCues: NodeCG.SoundCue[] = [];
		for (const rawCue of bundle.soundCues) {
			let file: NodeCG.CueFile | undefined;
			if (rawCue.defaultFile) {
				const filepath = path.join(bundle.dir, rawCue.defaultFile);
				const parsedPath = path.parse(filepath);
				file = {
					sum: sha1File.sync(filepath),
					base: parsedPath.base,
					ext: parsedPath.ext,
					name: parsedPath.name,
					url: `/sound/${bundle.name}/${rawCue.name}/default${parsedPath.ext}`,
					default: true,
				};
			}

			const formatted: NodeCG.SoundCue = {
				name: rawCue.name,
				assignable: Boolean(rawCue.assignable),
				volume: rawCue.defaultVolume ?? 30,
			};

			if ('defaultVolume' in rawCue) {
				formatted.defaultVolume = rawCue.defaultVolume;
			}

			if (file) {
				formatted.file = file;
				formatted.defaultFile = clone(file);
			}

			formattedCues.push(formatted);
		}

		return formattedCues;
	}
}
