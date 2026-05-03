import "./ncg-graphics-bundle";
import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../../css/nodecg-theme";
import type { NodeCG } from "../../../../types/nodecg";

class NcgGraphics extends LitElement {
	static override properties = {
		bundlesWithGraphics: { type: Array },
		_graphicInstances: { state: true },
		_toastText: { state: true },
		_showToast: { state: true },
	};

	bundlesWithGraphics = window.__renderData__.bundles.filter(
		(bundle) => bundle.graphics && bundle.graphics.length > 0,
	);
	private _graphicInstances: NodeCG.GraphicsInstance[] = [];
	private _toastText = "";
	private _showToast = false;
	private _toastTimer: ReturnType<typeof setTimeout> | null = null;

	static override styles = [
		nodecgTheme,
		css`
			:host {
				display: flex;
				flex-direction: column;
				font-family: Roboto, Noto, sans-serif;
				max-width: 800px;
				width: 100%;
			}

			.toast {
				position: fixed;
				bottom: 16px;
				left: 50%;
				transform: translateX(-50%);
				background: #323232;
				color: white;
				padding: 12px 24px;
				border-radius: 2px;
				z-index: 1000;
				opacity: 0;
				transition: opacity 0.3s ease;
				pointer-events: none;
			}

			.toast.visible {
				opacity: 1;
			}
		`,
	];

	override firstUpdated() {
		const instancesRep = window.NodeCG.Replicant<NodeCG.GraphicsInstance[]>(
			"graphics:instances",
			"nodecg",
		);
		instancesRep.on("change", (newVal) => {
			this._graphicInstances = newVal ?? [];
		});

		this.addEventListener("url-copy-success", () => {
			this._showMessage("Graphic URL copied to clipboard.");
		});
		this.addEventListener("url-copy-error", () => {
			this._showMessage("Failed to copy graphic URL to clipboard!");
		});
	}

	private _showMessage(text: string) {
		this._toastText = text;
		this._showToast = true;
		if (this._toastTimer !== null) clearTimeout(this._toastTimer);
		this._toastTimer = setTimeout(() => {
			this._showToast = false;
		}, 3000);
	}

	override render() {
		return html`
			${this.bundlesWithGraphics.map(
				(bundle) => html`
					<ncg-graphics-bundle
						.bundle=${bundle}
						.instances=${this._graphicInstances}
					></ncg-graphics-bundle>
				`,
			)}
			<div class="toast ${this._showToast ? "visible" : ""}">
				${this._toastText}
			</div>
		`;
	}
}

customElements.define("ncg-graphics", NcgGraphics);
