import { initialize } from "@open-iframe-resizer/core";
import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../css/nodecg-theme";
import { icon } from "../icons";

const HEX_PARSE_SHORTHAND_REGEX = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
const HEX_PARSE_REGEX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

export class NcgDashboardPanel extends LitElement {
	static override properties = {
		displayTitle: { type: String, reflect: true },
		bundle: { type: String, reflect: true },
		panel: { type: String, reflect: true },
		opened: { type: Boolean, reflect: true },
		headerColor: { type: String, reflect: true },
		width: { type: Number, reflect: true },
		fullbleed: { type: Boolean, reflect: true },
		standaloneUrl: { type: String },
	};

	displayTitle = "";
	bundle = "";
	panel = "";
	opened = true;
	headerColor = "";
	width = 2;
	fullbleed = false;
	standaloneUrl = "";

	static override styles = [
		nodecgTheme,
		css`
			:host {
				display: inline-block;
				width: 128px;
			}

			:host([fullbleed]) {
				width: 100% !important;
				height: 100% !important;
				display: flex;
				flex-direction: column;
			}

			:host(:not([fullbleed])) {
				box-shadow:
					0 2px 2px 0 rgba(0, 0, 0, 0.14),
					0 1px 5px 0 rgba(0, 0, 0, 0.12),
					0 3px 1px -2px rgba(0, 0, 0, 0.2);
			}

			:host([width="1"]) { width: 128px; }
			:host([width="2"]) { width: 272px; }
			:host([width="3"]) { width: 416px; }
			:host([width="4"]) { width: 560px; }
			:host([width="5"]) { width: 704px; }
			:host([width="6"]) { width: 848px; }
			:host([width="7"]) { width: 992px; }
			:host([width="8"]) { width: 1136px; }
			:host([width="9"]) { width: 1280px; }
			:host([width="10"]) { width: 1424px; }

			#header {
				position: relative;
				color: #f5f5f5;
				display: flex;
				flex-direction: row;
				justify-content: flex-end;
				align-items: center;
				flex: none;
				font-size: 20px;
				font-weight: 500;
				overflow: hidden;
				min-height: 48px;
				background-color: #525f78;
			}

			#header a {
				color: inherit;
			}

			#displayTitle {
				position: absolute;
				left: 15px;
				top: 6px;
				font-size: 16px;
			}

			#buttonsContainer {
				z-index: 1;
			}

			#more {
				position: absolute;
				right: 10px;
				top: 8px;
				color: rgba(255, 255, 255, 0.5);
				pointer-events: none;
			}

			#buttons {
				display: flex;
				flex-direction: row;
				align-items: center;
				padding-left: 8px;
				transform: translateX(100%);
				transition: transform 200ms ease;
			}

			#header:hover #buttons {
				transform: translateX(0%);
			}

			:host([fullbleed]) #buttons {
				transform: translateX(0%);
			}

			.icon-btn {
				background: none;
				border: none;
				color: inherit;
				cursor: pointer;
				padding: 8px;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			#dragHandle {
				cursor: grab;
			}

			#dragHandle:active {
				cursor: grabbing;
			}

			#body {
				min-height: 1px;
				padding: 0;
				background-color: #f5f5f5;
				overflow: hidden;
			}

			:host([fullbleed]) #collapse {
				flex: 1;
				display: flex;
				flex-direction: column;
			}

			:host([fullbleed]) #body {
				flex: 1;
			}

			:host([fullbleed]) ::slotted(iframe) {
				height: 100%;
			}

			#collapse {
				overflow: hidden;
				transition: max-height 0.3s ease;
			}

			#collapse:not(.open) {
				max-height: 0 !important;
			}
		`,
	];

	override connectedCallback() {
		super.connectedCallback();
		const iframeEl = this.querySelector("iframe");
		if (iframeEl) {
			this.standaloneUrl = `${iframeEl.src}?standalone=true`;
		}

		// Load persisted open state
		const storageKey = this._computeLocalStorageName(this.bundle, this.panel);
		const stored = localStorage.getItem(storageKey);
		this.opened = stored !== null ? JSON.parse(stored) : true;
	}

	override updated(changedProps: Map<string, unknown>) {
		if (changedProps.has("opened")) {
			const storageKey = this._computeLocalStorageName(this.bundle, this.panel);
			localStorage.setItem(storageKey, JSON.stringify(this.opened));

			const collapse = this.shadowRoot?.querySelector<HTMLDivElement>("#collapse");
			if (collapse) {
				if (this.opened) {
					// Set explicit height before transition so it can animate back to auto
					collapse.style.maxHeight = collapse.scrollHeight + "px";
					// After transition, allow content to grow freely
					collapse.addEventListener(
						"transitionend",
						() => { collapse.style.maxHeight = ""; },
						{ once: true },
					);
				} else {
					// Fix current height before collapsing
					collapse.style.maxHeight = collapse.scrollHeight + "px";
					requestAnimationFrame(() => {
						collapse.style.maxHeight = "0";
					});
				}
			}

			// Notify parent workspace for Packery reflow
			this.dispatchEvent(
				new CustomEvent("transitioning-changed", {
					detail: { value: !this.opened },
					bubbles: true,
					composed: true,
				}),
			);
		}

		if (changedProps.has("headerColor") && this.headerColor) {
			const header = this.shadowRoot?.querySelector<HTMLDivElement>("#header");
			const buttons = this.shadowRoot?.querySelector<HTMLDivElement>("#buttons");
			if (header) header.style.backgroundColor = this.headerColor;
			if (buttons) {
				const rgb = this._hexToRGB(this.headerColor);
				if (rgb) {
					const rgbStr = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
					buttons.style.background = `linear-gradient(to right, rgba(${rgbStr}, 0) 0px, rgba(${rgbStr}, 1) 10px)`;
				}
			}
		}
	}

	override firstUpdated() {
		void this._initIframe();
	}

	private async _initIframe() {
		const slot = this.shadowRoot!.querySelector<HTMLSlotElement>("#slot")!;
		const distributedNodes = slot.assignedNodes({ flatten: true }) as HTMLElement[];
		const iframe = distributedNodes.find(
			(el) => el.tagName === "IFRAME",
		) as HTMLIFrameElement | undefined;

		if (!iframe) return;

		if (window.ncgConfig.sentry.enabled) {
			const Sentry = await import("@sentry/browser");
			iframe.contentWindow?.addEventListener("error", (event) => {
				Sentry.captureException(event.error);
			});
			iframe.contentWindow?.addEventListener("unhandledrejection", (err) => {
				Sentry.captureException(err.reason);
			});
		}

		if (!this.fullbleed) {
			if (iframe.contentWindow?.document.readyState === "complete") {
				this._attachIframeResize(iframe);
			} else {
				iframe.addEventListener("load", () => this._attachIframeResize(iframe));
			}
		}
	}

	private _attachIframeResize(iframe: HTMLIFrameElement) {
		initialize(
			{
				onIframeResize: (context) => {
					const collapse = this.shadowRoot?.querySelector<HTMLDivElement>("#collapse");
					if (collapse && this.opened) {
						collapse.style.maxHeight = "";
					}
					context.iframe.dispatchEvent(new CustomEvent("iframe-resized"));
				},
			},
			iframe,
		);
	}

	get dragHandle(): HTMLButtonElement | null {
		return this.shadowRoot?.querySelector<HTMLButtonElement>("#dragHandle") ?? null;
	}

	private _toggleCollapse() {
		this.opened = !this.opened;
	}

	private _computeLocalStorageName(bundle: string, panel: string) {
		return [bundle, panel, "opened"].join(".");
	}

	private _hexToRGB(hex: string) {
		hex = hex.replace(
			HEX_PARSE_SHORTHAND_REGEX,
			(_m, r, g, b) => r + r + g + g + b + b,
		);
		const result = HEX_PARSE_REGEX.exec(hex);
		return result
			? {
					r: parseInt(result[1]!, 16),
					g: parseInt(result[2]!, 16),
					b: parseInt(result[3]!, 16),
				}
			: null;
	}

	override render() {
		return html`
			<div id="header">
				<span id="displayTitle">${this.displayTitle}</span>
				<div id="more">${icon("chevron-left", 20)}</div>
				<div id="buttonsContainer">
					<div id="buttons">
						<a href=${this.standaloneUrl} target="_blank">
							<button class="icon-btn" title="Open standalone">
								${icon("open-in-new")}
							</button>
						</a>
						${!this.fullbleed
							? html`
									<button
										class="icon-btn"
										id="expandBtn"
										@click=${this._toggleCollapse}
										title=${this.opened ? "Collapse" : "Expand"}
									>
										${icon(this.opened ? "unfold-less" : "unfold-more")}
									</button>
									<button class="icon-btn" id="dragHandle" title="Drag">
										${icon("open-with")}
									</button>
								`
							: ""}
					</div>
				</div>
			</div>

			<div
				id="collapse"
				class=${this.opened ? "open" : ""}
			>
				<div id="body">
					<slot id="slot"></slot>
				</div>
			</div>
		`;
	}
}

customElements.define("ncg-dashboard-panel", NcgDashboardPanel);
