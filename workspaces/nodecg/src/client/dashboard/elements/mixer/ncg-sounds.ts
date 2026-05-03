import "./ncg-sound-cue";
import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../../css/nodecg-theme";
import type { NcgSoundCue } from "./ncg-sound-cue";
import type { NodeCG as NCGTypes } from "../../../../types/nodecg";

class NcgSounds extends LitElement {
	static override properties = {
		bundleName: { type: String, reflect: true },
		soundCues: { type: Array },
	};

	bundleName = "";
	soundCues: NCGTypes.SoundCue[] = [];

	private bundleFaderRep: ReturnType<typeof NodeCG.Replicant<number>> | null =
		null;

	static override styles = [
		nodecgTheme,
		css`
			:host {
				flex: none;
				align-self: stretch;
				display: flex;
				flex-direction: column;
				max-width: 600px;
				white-space: nowrap;
				width: 100%;
			}

			.card {
				background-color: #2f3a4f;
				width: 100%;
				box-shadow:
					0 2px 2px 0 rgba(0, 0, 0, 0.14),
					0 1px 5px 0 rgba(0, 0, 0, 0.12),
					0 3px 1px -2px rgba(0, 0, 0, 0.2);
			}

			.card-header {
				background-color: #525f78;
				border-bottom: 5px solid var(--nodecg-brand-blue);
				font-weight: bold;
				color: white;
				padding: 16px;
				font-size: 20px;
				font-weight: 500;
			}

			#bundleFaderContainer {
				display: flex;
				flex-direction: row;
				align-items: center;
				background-color: #525f78;
				padding: 0 16px;
			}

			#bundleFaderContainer > span {
				font-size: 20px;
				font-weight: 500;
				min-width: 166px;
				flex-grow: 1;
				flex-shrink: 0;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			#bundleFader {
				flex-shrink: 1;
				width: 160px;
				accent-color: white;
			}

			#cues {
				background-color: #2f3a4f;
				padding-bottom: 8px;
			}
		`,
	];

	override firstUpdated() {
		const cueElsByName: Record<string, NcgSoundCue> = {};

		this.bundleFaderRep = NodeCG.Replicant<number>(
			`volume:${this.bundleName}`,
			"_sounds",
		);

		const cuesRep = NodeCG.Replicant<NCGTypes.SoundCue[]>(
			"soundCues",
			this.bundleName,
		);

		this.bundleFaderRep.on("change", (newVal) => {
			if (newVal === undefined) return;
			const slider = this.shadowRoot?.querySelector<HTMLInputElement>(
				"#bundleFader",
			);
			if (slider) slider.value = String(newVal);
		});

		cuesRep.on("change", (newVal) => {
			if (!newVal) return;
			const cuesContainer =
				this.shadowRoot?.querySelector<HTMLDivElement>("#cues");
			if (!cuesContainer) return;

			newVal.forEach((cue) => {
				if (!cueElsByName[cue.name]) {
					cueElsByName[cue.name] = document.createElement(
						"ncg-sound-cue",
					) as NcgSoundCue;
					cuesContainer.appendChild(cueElsByName[cue.name]!);
				}
				const el = cueElsByName[cue.name]!;
				el.name = cue.name;
				el.assignable = cue.assignable;
				el.defaultFile = cue.defaultFile ?? null;
				el.file = cue.file ?? null;
				el.volume = cue.volume;
				el._cueRef = cue;
				el.bundleName = this.bundleName;
			});

			for (const name in cueElsByName) {
				if (!Object.prototype.hasOwnProperty.call(cueElsByName, name)) continue;
				const el = cueElsByName[name]!;
				if (newVal.findIndex((c) => c.name === el.name) < 0) {
					cuesContainer.removeChild(el);
					delete cueElsByName[name];
				}
			}
		});
	}

	private _onBundleFaderChange(e: Event) {
		if (this.bundleFaderRep) {
			this.bundleFaderRep.value = Number(
				(e.target as HTMLInputElement).value,
			);
		}
	}

	override render() {
		return html`
			<div class="card">
				<div class="card-header">${this.bundleName}</div>
				<div class="card-content">
					<div id="bundleFaderContainer">
						<span>Bundle Fader</span>
						<input
							id="bundleFader"
							type="range"
							min="0"
							max="100"
							step="1"
							@change=${this._onBundleFaderChange}
						/>
					</div>
					<div id="cues"></div>
				</div>
			</div>
		`;
	}
}

customElements.define("ncg-sounds", NcgSounds);
