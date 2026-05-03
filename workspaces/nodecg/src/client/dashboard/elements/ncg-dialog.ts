import { initialize } from "@open-iframe-resizer/core";
import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../css/nodecg-theme";

export class NcgDialog extends LitElement {
	static override properties = {
		bundle: { type: String, reflect: true },
		panel: { type: String, reflect: true },
		width: { type: Number, reflect: true },
		opened: { type: Boolean, reflect: true },
	};

	bundle = "";
	panel = "";
	width = 0;
	opened = false;

	static override styles = [
		nodecgTheme,
		css`
			:host {
				display: contents;
			}

			dialog {
				background-color: #2f3a4f;
				color: white;
				border: none;
				display: flex;
				flex-direction: column;
				max-width: 100%;
				padding: 0;
			}

			dialog::backdrop {
				background: rgba(0, 0, 0, 0.5);
			}

			:host([width="1"]) dialog { width: 128px; }
			:host([width="2"]) dialog { width: 272px; }
			:host([width="3"]) dialog { width: 416px; }
			:host([width="4"]) dialog { width: 560px; }
			:host([width="5"]) dialog { width: 704px; }
			:host([width="6"]) dialog { width: 848px; }
			:host([width="7"]) dialog { width: 992px; }
			:host([width="8"]) dialog { width: 1136px; }
			:host([width="9"]) dialog { width: 1280px; }
			:host([width="10"]) dialog { width: 1424px; }

			.dialog-scrollable {
				overflow-y: auto;
				max-height: 80vh;
				padding: 0 24px;
			}

			::slotted(iframe) {
				box-sizing: border-box;
				margin: 0 !important;
				padding: 0 !important;
				width: 100%;
			}

			::slotted(h2) {
				margin: 0;
				padding: 16px 24px 0;
			}

			::slotted(.buttons) {
				display: flex;
				justify-content: flex-end;
				gap: 8px;
				padding: 16px 24px;
			}
		`,
	];

	private get _dialog(): HTMLDialogElement {
		return this.shadowRoot!.querySelector<HTMLDialogElement>("dialog")!;
	}

	open() {
		this.opened = true;
		this._dialog.showModal();
		this._onDialogOpened();
	}

	close() {
		this._dialog.close();
	}

	refit() {
		// Native <dialog> positions itself; no-op
	}

	override firstUpdated() {
		this._dialog.addEventListener("close", () => {
			const wasOpened = this.opened;
			this.opened = false;
			if (wasOpened) {
				this._onDialogClosed(false);
			}
		});

		// Handle dialog-confirm / dialog-dismiss clicks in slotted content
		this.addEventListener("click", (e: Event) => {
			const target = e.target as HTMLElement;
			const btn = target.closest("[dialog-confirm],[dialog-dismiss]");
			if (!btn) return;
			const confirmed = btn.hasAttribute("dialog-confirm");
			this._dialog.close();
			this.opened = false;
			this._onDialogClosed(confirmed);
		});

		const iframe = this.querySelector("iframe");
		if (iframe) {
			iframe.addEventListener("iframe-resized", () => {
				// Native dialog auto-positions; no explicit refit needed
			});

			void this._attachSentryAndResize(iframe);
		}
	}

	private async _attachSentryAndResize(iframe: HTMLIFrameElement) {
		if (window.ncgConfig.sentry.enabled) {
			const Sentry = await import("@sentry/browser");
			iframe.contentWindow?.addEventListener("error", (event: any) => {
				Sentry.captureException(event.error);
			});
			iframe.contentWindow?.addEventListener("unhandledrejection", (err: any) => {
				Sentry.captureException(err.reason);
			});
		}

		const attach = () => {
			initialize(
				{
					onIframeResize(context) {
						context.iframe.dispatchEvent(new CustomEvent("iframe-resized"));
					},
				},
				iframe,
			);
		};

		if (iframe.contentWindow?.document.readyState === "complete") {
			attach();
		} else {
			iframe.addEventListener("load", attach);
		}
	}

	private _onDialogOpened() {
		const iframeDoc = this.querySelector("iframe")?.contentDocument;
		iframeDoc?.dispatchEvent(new CustomEvent("dialog-opened"));
	}

	private _onDialogClosed(confirmed: boolean) {
		const iframeDoc = this.querySelector("iframe")?.contentDocument;
		if (confirmed) {
			iframeDoc?.dispatchEvent(new CustomEvent("dialog-confirmed"));
		} else {
			iframeDoc?.dispatchEvent(new CustomEvent("dialog-dismissed"));
		}
	}

	override render() {
		return html`
			<dialog>
				<slot></slot>
			</dialog>
		`;
	}
}

customElements.define("ncg-dialog", NcgDialog);
