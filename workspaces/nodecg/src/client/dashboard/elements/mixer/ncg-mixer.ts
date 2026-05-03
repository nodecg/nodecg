import "./ncg-sounds";
import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../../css/nodecg-theme";

class NcgMixer extends LitElement {
	static override properties = {
		bundlesWithSounds: { type: Array },
	};

	bundlesWithSounds = window.__renderData__.bundles.filter(
		(bundle) => bundle.soundCues && bundle.soundCues.length > 0,
	);

	static override styles = [
		nodecgTheme,
		css`
			:host {
				white-space: nowrap;
				width: 100%;
				max-width: 600px;
				display: flex;
				flex-direction: column;
				align-items: stretch;
			}

			.master-card {
				background-color: #525f78;
				border-bottom: 5px solid var(--nodecg-brand-blue);
				margin-bottom: 16px;
				padding: 16px;
				display: flex;
				flex-direction: row;
				align-items: center;
				box-shadow:
					0 2px 2px 0 rgba(0, 0, 0, 0.14),
					0 1px 5px 0 rgba(0, 0, 0, 0.12),
					0 3px 1px -2px rgba(0, 0, 0, 0.2);
			}

			.master-card span {
				font-size: 28px;
				font-weight: 500;
				flex-grow: 1;
				flex-shrink: 0;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			#masterFader {
				flex-shrink: 1;
				width: 170px;
				accent-color: white;
			}

			ncg-sounds {
				margin-bottom: 12px;
			}
		`,
	];

	override firstUpdated() {
		const masterFader = this.shadowRoot!.querySelector<HTMLInputElement>(
			"#masterFader",
		)!;
		const masterVolume = NodeCG.Replicant("volume:master", "_sounds");

		masterFader.addEventListener("change", (e) => {
			masterVolume.value = Number((e.target as HTMLInputElement).value);
		});

		masterVolume.on("change", (newVal) => {
			masterFader.value = String(newVal);
		});
	}

	override render() {
		return html`
			<div class="master-card">
				<span>Master Fader</span>
				<input
					id="masterFader"
					type="range"
					min="0"
					max="100"
					step="1"
				/>
			</div>

			${this.bundlesWithSounds.map(
				(bundle) => html`
					<ncg-sounds bundle-name=${bundle.name}></ncg-sounds>
				`,
			)}
		`;
	}
}

customElements.define("ncg-mixer", NcgMixer);
