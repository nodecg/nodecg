import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../../css/nodecg-theme";
import { icon } from "../../icons";
import Clipboard from "clipboard";

class NcgSettings extends LitElement {
	static override properties = {
		_toastText: { state: true },
		_showToast: { state: true },
	};

	private _toastText = "";
	private _showToast = false;
	private _toastTimer: ReturnType<typeof setTimeout> | null = null;

	static override styles = [
		nodecgTheme,
		css`
			:host {
				display: flex;
				flex-direction: column;
				max-width: 600px;
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
				color: white;
				font-size: 20px;
				font-weight: bold;
				padding: 16px;
			}

			.card-content {
				padding: 16px;
			}

			.card-actions {
				padding-top: 8px;
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: flex-end;
				gap: 8px;
			}

			button.action-btn {
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: center;
				gap: 0.5em;
				background: var(--nodecg-background-color, #525f78);
				border: none;
				border-radius: 0;
				color: white;
				cursor: pointer;
				font-size: 16px;
				font-weight: 300;
				padding: 8px 16px;
				white-space: nowrap;
			}

			button.nodecg-benign { --nodecg-background-color: var(--nodecg-benign-color); }
			button.nodecg-configure { --nodecg-background-color: var(--nodecg-configure-color); }
			button.nodecg-reject { --nodecg-background-color: var(--nodecg-reject-color); }

			@media (max-width: 400px) {
				button.action-btn svg {
					display: none;
				}
			}

			dialog {
				background: #2f3a4f;
				color: white;
				border: none;
				padding: 24px;
				min-width: 300px;
			}

			dialog::backdrop {
				background: rgba(0, 0, 0, 0.5);
			}

			dialog h2 { margin-top: 0; }

			code {
				font-family: monospace;
				font-size: 14px;
				word-break: break-all;
			}

			.text-warning b {
				color: #ffc700;
			}

			.dialog-buttons {
				display: flex;
				gap: 8px;
				justify-content: flex-end;
				margin-top: 16px;
			}

			.btn-close {
				background: var(--nodecg-benign-color);
				border: none;
				border-radius: 0;
				color: white;
				cursor: pointer;
				padding: 8px 16px;
			}

			.btn-confirm {
				background: var(--nodecg-reject-color);
				border: none;
				border-radius: 0;
				color: white;
				cursor: pointer;
				padding: 8px 16px;
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
		const copyKeyBtn =
			this.shadowRoot!.querySelector<HTMLButtonElement>("#copyKey")!;

		if (window.ncgConfig.login?.enabled && window.token) {
			copyKeyBtn.setAttribute("data-clipboard-text", window.token);
		}

		const clipboard = new Clipboard(copyKeyBtn);
		clipboard.on("success", () => {
			this._showMessage("Key copied to clipboard.");
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

	private _openShowKeyDialog() {
		this.shadowRoot?.querySelector<HTMLDialogElement>("#showKeyDialog")?.showModal();
	}

	private _openResetKeyDialog() {
		this.shadowRoot?.querySelector<HTMLDialogElement>("#resetKeyDialog")?.showModal();
	}

	private _closeDialog(dialogId: string) {
		this.shadowRoot?.querySelector<HTMLDialogElement>(`#${dialogId}`)?.close();
	}

	private _resetKey() {
		window.socket.emit("regenerateToken", (err) => {
			if (err) {
				console.error(err);
				return;
			}
			document.location.reload();
		});
	}

	override render() {
		return html`
			<div class="card">
				<div class="card-header">Your Key</div>
				<div class="card-content">
					<p style="margin-top: 0; padding: 0; font-size: 14px;">
						Resetting your key will disrupt all current sessions using it.<br />
						When you reset your key, the dashboard will be refreshed so that a
						new key can be obtained.
					</p>
					<div class="card-actions">
						<button
							id="copyKey"
							class="action-btn nodecg-benign"
						>
							${icon("content-copy")}
							<span>Copy Key</span>
						</button>
						<button
							class="action-btn nodecg-configure"
							@click=${this._openShowKeyDialog}
						>
							${icon("vpn-key")}
							<span>Show Key</span>
						</button>
						<button
							class="action-btn nodecg-reject"
							@click=${this._openResetKeyDialog}
						>
							${icon("refresh")}
							<span>Reset Key</span>
						</button>
					</div>
				</div>
			</div>

			<dialog id="showKeyDialog">
				<h2>NodeCG Key</h2>
				<div>
					<code>${window.token ?? ""}</code>
					<p class="text-warning" style="font-size: 14px;">
						<b>Do not</b> give this key to anyone or show it on stream!<br />
						If you accidentally reveal it, <b>reset it immediately!</b>
					</p>
				</div>
				<div class="dialog-buttons">
					<button
						class="btn-close"
						@click=${() => this._closeDialog("showKeyDialog")}
					>
						Close
					</button>
				</div>
			</dialog>

			<dialog id="resetKeyDialog">
				<h2>Reset NodeCG Key</h2>
				<div>
					<p class="text-warning" style="font-size: 14px;">
						Are you sure you wish to reset your <b>NodeCG key</b>?<br />
						Doing so will invalidate all URLs currently loaded into your
						streaming software!
					</p>
				</div>
				<div class="dialog-buttons">
					<button
						class="btn-close"
						@click=${() => this._closeDialog("resetKeyDialog")}
					>
						No, Cancel
					</button>
					<button
						class="btn-confirm"
						@click=${this._resetKey}
					>
						Yes, reset
					</button>
				</div>
			</dialog>

			<div class="toast ${this._showToast ? "visible" : ""}">
				${this._toastText}
			</div>
		`;
	}
}

customElements.define("ncg-settings", NcgSettings);
