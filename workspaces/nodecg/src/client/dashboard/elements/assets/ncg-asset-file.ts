import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../../css/nodecg-theme";
import { icon } from "../../icons";

class NcgAssetFile extends LitElement {
	static override properties = {
		file: { type: Object },
		deleting: { type: Boolean },
	};

	file: { url: string; base: string } = { url: "", base: "" };
	deleting = false;

	static override styles = [
		nodecgTheme,
		css`
			:host {
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: space-between;
				margin: 4px 0;
			}

			#name {
				line-height: 24px;
				overflow: hidden;
				text-overflow: ellipsis;
				text-transform: none;
			}

			.controls {
				display: flex;
				flex-direction: row;
				align-items: center;
				flex-shrink: 0;
				margin-right: 21px;
				gap: 8px;
			}

			.spinner {
				width: 24px;
				height: 24px;
				border: 3px solid rgba(163, 59, 59, 0.3);
				border-top-color: var(--nodecg-reject-color);
				border-radius: 50%;
				animation: spin 0.8s linear infinite;
			}

			@keyframes spin {
				to {
					transform: rotate(360deg);
				}
			}

			button {
				display: none;
			}

			:host(:not([deleting])) .spinner {
				display: none;
			}

			:host(:not([deleting])) button {
				display: inline-flex;
				align-items: center;
				gap: 4px;
				background: var(--nodecg-reject-color);
				border: none;
				border-radius: 0;
				color: white;
				cursor: pointer;
				font-size: 14px;
				padding: 6px 12px;
			}
		`,
	];

	private async _handleDeleteClick() {
		this.deleting = true;
		try {
			const response = await fetch(this.file.url, {
				method: "DELETE",
				credentials: "include",
			});
			if (response.status === 410 || response.status === 200) {
				this.dispatchEvent(
					new CustomEvent("deleted", { bubbles: true, composed: true }),
				);
			} else {
				this.dispatchEvent(
					new CustomEvent("deletion-failed", { bubbles: true, composed: true }),
				);
			}
		} finally {
			this.deleting = false;
		}
	}

	override render() {
		return html`
			<a id="name" href=${this.file.url} target="_blank">${this.file.base}</a>
			<div class="controls">
				${this.deleting ? html`<div class="spinner" aria-label="Deleting"></div>` : html`
					<button @click=${this._handleDeleteClick}>
						${icon("delete")} Delete
					</button>
				`}
			</div>
		`;
	}
}

customElements.define("ncg-asset-file", NcgAssetFile);
