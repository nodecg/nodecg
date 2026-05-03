import "../ui/ui-select";
import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../../css/nodecg-theme";
import type { UiSelect } from "../ui/ui-select";
import type { NodeCG as NCGTypes } from "../../../../types/nodecg";

export class NcgSoundCue extends LitElement {
	static override properties = {
		name: { type: String },
		bundleName: { type: String },
		assignable: { type: Boolean },
		file: { type: Object },
		defaultFile: { type: Object },
		volume: { type: Number },
		_cueRef: { type: Object },
		soundFiles: { type: Array },
	};

	name = "";
	bundleName = "";
	assignable = false;
	file: NCGTypes.CueFile | null = null;
	defaultFile: NCGTypes.CueFile | null = null;
	volume = 0;
	_cueRef: NCGTypes.SoundCue | null = null;
	soundFiles: NCGTypes.AssetFile[] = [];

	private _assetsRepInitialized = false;

	static override styles = [
		nodecgTheme,
		css`
			:host {
				display: flex;
				flex-direction: row;
				align-items: center;
			}

			#leftWrapper {
				min-width: 0;
				padding-right: 8px;
				display: flex;
				flex-direction: column;
				justify-content: center;
				flex: 1;
			}

			#name {
				font-size: 20px;
				font-weight: 500;
				line-height: 28px;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			ui-select {
				display: none;
				width: 150px;
				flex: none;
			}

			ui-select.assignable {
				display: block;
			}

			input[type="range"] {
				flex: none;
				width: 180px;
				accent-color: white;
			}

			@media (max-width: 500px) {
				ui-select {
					width: 120px;
				}

				input[type="range"] {
					width: 150px;
				}
			}
		`,
	];

	override updated(changedProps: Map<string, unknown>) {
		if (changedProps.has("bundleName")) {
			this._bundleNameChanged(this.bundleName);
		}
		if (changedProps.has("assignable")) {
			// CSS class handles visibility
		}
		if (changedProps.has("file")) {
			this._fileChanged(this.file);
		}
		if (changedProps.has("volume")) {
			const slider = this.shadowRoot?.querySelector<HTMLInputElement>("#slider");
			if (slider) slider.value = String(this.volume);
		}
	}

	private _bundleNameChanged(bundleName: string) {
		if (!bundleName || this._assetsRepInitialized) return;
		this._assetsRepInitialized = true;

		const assetsRep = NodeCG.Replicant<NCGTypes.AssetFile[]>(
			"assets:sounds",
			bundleName,
		);
		assetsRep.setMaxListeners(50);
		assetsRep.on("change", (newVal) => {
			if (newVal && this.assignable) {
				this.soundFiles = newVal;
				this._generateOptions(newVal);
			}
		});
	}

	private _fileChanged(newVal: NCGTypes.CueFile | null) {
		const select =
			this.shadowRoot?.querySelector("ui-select") as unknown as UiSelect | null;
		if (!select) return;
		if (newVal) {
			select.value = newVal.default ? "default" : newVal.base;
		} else {
			select.value = "none";
		}
	}

	private _generateOptions(soundFiles: NCGTypes.AssetFile[]) {
		const select =
			this.shadowRoot?.querySelector("ui-select") as unknown as UiSelect | null;
		if (!select) return;

		while (select.item(0)) {
			select.removeOptionAt(0);
		}

		const noneOption = document.createElement("option");
		noneOption.innerText = "None";
		noneOption.value = "none";
		if (!this.file) noneOption.setAttribute("selected", "true");
		select.add(noneOption);

		if (this.defaultFile) {
			const defaultOption = document.createElement("option");
			defaultOption.value = "default";
			defaultOption.innerText = "Default";
			if (this.file?.default) defaultOption.setAttribute("selected", "true");
			select.add(defaultOption);
		}

		if (Array.isArray(soundFiles)) {
			soundFiles.forEach((f, index) => {
				const option = document.createElement("option");
				option.value = f.base;
				option.innerText = f.base;
				(option as any).replicantIndex = index;
				if (this.file && f.base === this.file.base) {
					option.setAttribute("selected", "true");
				}
				select.add(option);
			});
		}
	}

	private _retargetFile() {
		const select =
			this.shadowRoot?.querySelector("ui-select") as unknown as UiSelect | null;
		if (!select || !this._cueRef) return;
		const selectValue = select.value;
		if (selectValue === "none") {
			this._cueRef.file = undefined;
		} else if (selectValue === "default") {
			this._cueRef.file = this.defaultFile ?? undefined;
		} else {
			const idx = select.selectedOptions[0]
				? (select.selectedOptions[0] as any).replicantIndex
				: -1;
			this._cueRef.file = (this.soundFiles[idx] as unknown as NCGTypes.CueFile | undefined) ?? undefined;
		}
	}

	private _onSliderChange(e: Event) {
		if (this._cueRef) {
			this._cueRef.volume = Number((e.target as HTMLInputElement).value);
		}
	}

	override render() {
		return html`
			<div id="leftWrapper">
				<span id="name">${this.name}</span>
			</div>
			<ui-select
				class=${this.assignable ? "assignable" : ""}
				@change=${this._retargetFile}
			></ui-select>
			<input
				id="slider"
				type="range"
				min="0"
				max="100"
				step="1"
				.value=${String(this.volume)}
				@change=${this._onSliderChange}
			/>
		`;
	}
}

customElements.define("ncg-sound-cue", NcgSoundCue);
