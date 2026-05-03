import "./ncg-graphic";
import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../../css/nodecg-theme";
import { icon } from "../../icons";
import type { NodeCG } from "../../../../types/nodecg";

class NcgGraphicsBundle extends LitElement {
	static override properties = {
		bundle: { type: Object },
		instances: { type: Array },
	};

	bundle: NodeCG.Bundle | null = null;
	instances: NodeCG.GraphicsInstance[] = [];

	static override styles = [
		nodecgTheme,
		css`
			:host {
				flex: none;
				display: flex;
				flex-direction: column;
				box-shadow:
					0 2px 2px 0 rgba(0, 0, 0, 0.14),
					0 1px 5px 0 rgba(0, 0, 0, 0.12),
					0 3px 1px -2px rgba(0, 0, 0, 0.2);
				background: #2f3a4f;
				color: white;
				margin-bottom: 20px;
			}

			#titleBar {
				display: flex;
				flex-direction: row;
				background-color: #525f78;
				border-bottom: 5px solid var(--nodecg-brand-blue);
				margin-bottom: 13px;
			}

			#bundleName {
				font-size: 24px;
				font-style: normal;
				font-weight: normal;
				line-height: normal;
				padding: 6px 17px;
				flex: 1;
			}

			#reloadButton {
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: center;
				flex: none;
				background: var(--nodecg-execute-color);
				border: none;
				border-radius: 0;
				color: black;
				cursor: pointer;
				font-size: 14px;
				font-weight: 500;
				margin-left: 2px;
				margin-right: 0;
				min-width: 0;
				padding: 0 12px;
				width: 160px;
			}

			#reloadButton:disabled {
				opacity: 0.5;
				cursor: default;
			}

			dialog {
				background-color: #2f3a4f;
				color: white;
				border: none;
				padding: 24px;
				min-width: 300px;
			}

			dialog::backdrop {
				background: rgba(0, 0, 0, 0.5);
			}

			dialog h2 {
				margin-top: 0;
			}

			.dialog-buttons {
				display: flex;
				gap: 8px;
				justify-content: flex-end;
				margin-top: 16px;
			}

			.btn-cancel {
				background: #c9513e;
				border: none;
				border-radius: 0;
				color: white;
				cursor: pointer;
				padding: 8px 16px;
			}

			.btn-confirm {
				background: #5ba664;
				border: none;
				border-radius: 0;
				color: white;
				cursor: pointer;
				padding: 8px 16px;
			}
		`,
	];

	private _showReloadAllConfirmDialog() {
		this.shadowRoot?.querySelector<HTMLDialogElement>("dialog")?.showModal();
	}

	private _closeDialog(confirmed: boolean) {
		this.shadowRoot?.querySelector<HTMLDialogElement>("dialog")?.close();

		if (confirmed) {
			const btn =
				this.shadowRoot!.querySelector<HTMLButtonElement>("#reloadButton")!;
			btn.disabled = true;
			window.socket.emit(
				"graphic:requestBundleRefresh",
				this.bundle?.name ?? "",
				() => {
					btn.disabled = false;
				},
			);
		}
	}

	private _calcGraphicInstances(
		bundle?: NodeCG.Bundle | null,
		graphic?: NodeCG.Bundle.Graphic,
		instances?: NodeCG.GraphicsInstance[],
	) {
		if (!graphic || !Array.isArray(instances) || !bundle) return [];
		return instances.filter(
			(i) => i.bundleName === bundle.name && i.pathName === graphic.url,
		);
	}

	override render() {
		if (!this.bundle) return html``;
		return html`
			<div id="titleBar">
				<div id="bundleName">${this.bundle.name}</div>
				<button
					id="reloadButton"
					@click=${this._showReloadAllConfirmDialog}
				>
					${icon("refresh")}
					<span>&nbsp;Reload All</span>
				</button>
			</div>

			${this.bundle.graphics?.map(
				(graphic) => html`
					<ncg-graphic
						.graphic=${graphic}
						.instances=${this._calcGraphicInstances(this.bundle, graphic, this.instances)}
					></ncg-graphic>
				`,
			) ?? ""}

			<dialog>
				<h2>Confirm Reload</h2>
				<p>
					Are you sure you want to reload all open instances of
					<b>${this.bundle.name}</b> graphics?
				</p>
				<div class="dialog-buttons">
					<button class="btn-cancel" @click=${() => this._closeDialog(false)}>
						No, Cancel
					</button>
					<button
						class="btn-confirm"
						autofocus
						@click=${() => this._closeDialog(true)}
					>
						Yes, Reload
					</button>
				</div>
			</dialog>
		`;
	}
}

customElements.define("ncg-graphics-bundle", NcgGraphicsBundle);
