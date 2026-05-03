import "./ncg-graphic-instance";
import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../../css/nodecg-theme";
import { icon } from "../../icons";
import Clipboard from "clipboard";
import type { NodeCG } from "../../../../types/nodecg";

class NcgGraphic extends LitElement {
	static override properties = {
		graphic: { type: Object },
		instances: { type: Array },
		worstStatus: { type: String, reflect: true },
		responsiveMode: { type: String, reflect: true },
		_collapseOpened: { state: true },
		_wide: { state: true },
		_medium: { state: true },
		_narrow: { state: true },
	};

	graphic: NodeCG.Bundle.Graphic | null = null;
	instances: NodeCG.GraphicsInstance[] = [];
	worstStatus = "none";
	responsiveMode = "";
	private _collapseOpened = true;
	private _wide = false;
	private _medium = false;
	private _narrow = false;
	private _mql: MediaQueryList[] = [];
	private _mqlUpdateHandler: (() => void) | null = null;

	static override styles = [
		nodecgTheme,
		css`
			:host {
				display: flex;
				flex-direction: column;
				flex: none;
				white-space: nowrap;
			}

			:host(:not(:last-child)) {
				margin-bottom: 20px;
			}

			#details {
				display: flex;
				flex-direction: row;
				flex: none;
				height: 60px;
			}

			#indicator {
				flex: none;
				background-color: #cacaca;
				width: 9px;
			}

			:host([worst-status="nominal"]) #indicator {
				background-color: #00a651;
			}

			:host([worst-status="out-of-date"]) #indicator {
				background-color: #ffc700;
			}

			#counter {
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: center;
				flex: none;
				background-color: #525f78;
				color: #ffffff;
				font-size: 24px;
				font-weight: 500;
				text-align: center;
				width: 38px;
			}

			#urlAndResolution {
				flex: 1;
				background-color: #525f78;
				margin-right: 1px;
				min-width: 0;
				padding: 0 8px;
				display: flex;
				flex-direction: row;
				align-items: center;
			}

			#url {
				color: white;
				font-size: 16px;
				font-weight: 500;
				letter-spacing: 0.018em;
				max-width: 100%;
				min-width: 0;
				overflow: hidden;
				text-decoration: underline;
				text-overflow: ellipsis;
				text-transform: uppercase;
				cursor: pointer;
			}

			#resolution {
				flex: none;
				font-size: 14px;
				font-weight: 500;
				overflow: hidden;
				text-overflow: ellipsis;
				margin-left: auto;
				box-sizing: border-box;
				padding: 0 4px;
				text-align: center;
				width: 90px;
			}

			button {
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: center;
				flex: none;
				border-radius: 0;
				border: none;
				color: white;
				cursor: pointer;
				font-size: 14px;
				font-weight: 500;
				margin: 0 1px;
				min-width: 0;
				padding: 0;
				width: 60px;
				background: #6155bd;
			}

			button:last-child {
				margin-right: 0;
			}

			button:disabled {
				opacity: 0.5;
				cursor: default;
			}

			#collapseButton {
				background: #525f78;
				width: 60px;
			}

			#reloadButton {
				width: 60px;
			}

			:host([responsive-mode="wide"]) #reloadButton {
				width: 115px;
			}

			:host(:not([responsive-mode="wide"])) #urlAndResolution {
				flex-direction: column;
				justify-content: center;
				align-items: flex-start;
				padding-right: 6px;
			}

			:host(:not([responsive-mode="narrow"])) #copyButton {
				width: 115px;
			}

			:host([responsive-mode="narrow"]) .copyButton-text {
				display: none;
			}

			:host(:not([responsive-mode="wide"])) .reloadButton-text {
				display: none;
			}

			:host(:not([responsive-mode="wide"])) #resolution {
				display: none;
			}

			:host(:not([responsive-mode="narrow"])) #counter {
				padding-right: 8px;
			}

			.instances-collapse {
				overflow: hidden;
			}

			.instances-collapse:not(.open) {
				display: none;
			}
		`,
	];

	override connectedCallback() {
		super.connectedCallback();

		const mqlWide = window.matchMedia("(min-width: 641px)");
		const mqlMedium = window.matchMedia(
			"(min-width: 521px) and (max-width: 640px)",
		);
		const mqlNarrow = window.matchMedia("(max-width: 520px)");

		const update = () => {
			this._wide = mqlWide.matches;
			this._medium = mqlMedium.matches;
			this._narrow = mqlNarrow.matches;
			this.responsiveMode = this._computeResponsiveMode();
		};

		mqlWide.addEventListener("change", update);
		mqlMedium.addEventListener("change", update);
		mqlNarrow.addEventListener("change", update);
		this._mql = [mqlWide, mqlMedium, mqlNarrow];
		this._mqlUpdateHandler = update;
		update();
	}

	override disconnectedCallback() {
		super.disconnectedCallback();
		if (this._mqlUpdateHandler) {
			for (const mql of this._mql) {
				mql.removeEventListener("change", this._mqlUpdateHandler);
			}
		}
		this._mql = [];
		this._mqlUpdateHandler = null;
	}

	override firstUpdated() {
		const clipboard = new Clipboard(
			this.shadowRoot!.querySelector<HTMLButtonElement>("#copyButton")!,
		);
		this._initClipboard(clipboard);

		const urlEl = this.shadowRoot!.querySelector<HTMLAnchorElement>("#url")!;
		urlEl.addEventListener("dragstart", this._onDrag.bind(this));
	}

	override updated(changedProps: Map<string, unknown>) {
		if (
			changedProps.has("instances") ||
			changedProps.has("graphic")
		) {
			if (this.graphic) {
				this.worstStatus = this._computeWorstStatus(this.instances);
			}
		}
	}

	private _computeResponsiveMode() {
		if (this._wide) return "wide";
		if (this._medium) return "medium";
		if (this._narrow) return "narrow";
		return "";
	}

	private reloadAll() {
		if (!this.graphic) return;
		const btn =
			this.shadowRoot!.querySelector<HTMLButtonElement>("#reloadButton")!;
		btn.disabled = true;
		window.socket.emit("graphic:requestRefreshAll", this.graphic, () => {
			btn.disabled = false;
		});
	}

	private toggleCollapse() {
		this._collapseOpened = !this._collapseOpened;
	}

	private _initClipboard(clipboard: Clipboard) {
		clipboard.on("success", () => {
			this.dispatchEvent(
				new CustomEvent("url-copy-success", { bubbles: true, composed: true }),
			);
		});
		clipboard.on("error", (e: ClipboardJS.Event) => {
			this.dispatchEvent(
				new CustomEvent("url-copy-error", { bubbles: true, composed: true }),
			);
			console.error(e);
		});
	}

	private _calcShortUrl(graphicUrl: string) {
		return graphicUrl.split("/").slice(4).join("/");
	}

	private _computeFullGraphicUrl(url: string) {
		const a = document.createElement("a");
		a.href = url;
		let absUrl = a.href;
		if (window.ncgConfig.login?.enabled && window.token) {
			absUrl += `?key=${window.token}`;
		}
		return absUrl;
	}

	private _computeWorstStatus(
		instances?: NodeCG.GraphicsInstance[],
	): string {
		if (!instances) return "none";
		const open = instances.filter((i) => i.open);
		if (open.length <= 0) return "none";
		return open.some((i) => i.potentiallyOutOfDate) ? "out-of-date" : "nominal";
	}

	private _calcCount(
		singleInstance: boolean,
		instances?: NodeCG.GraphicsInstance[],
	) {
		if (singleInstance) return "S";
		return instances?.filter((i) => i.open).length ?? "?";
	}

	private _calcReloadAllDisabled(instances?: NodeCG.GraphicsInstance[]) {
		return !instances || instances.length <= 0;
	}

	private _onDrag(event: DragEvent) {
		if (!event.target || !event.dataTransfer || !this.graphic) return;
		const dragged = event.target as HTMLAnchorElement;
		let obsURL =
			window.ncgConfig.login.enabled && window.token
				? `${dragged.href}&`
				: `${dragged.href}?`;
		obsURL += `layer-name=${this.graphic.file.replace(".html", "")}&layer-height=${this.graphic.height}&layer-width=${this.graphic.width}`;
		event.dataTransfer.setData("text/uri-list", obsURL);
	}

	override render() {
		if (!this.graphic) return html``;
		const fullUrl = this._computeFullGraphicUrl(this.graphic.url);
		return html`
			<div id="details">
				<div id="indicator"></div>
				<div id="counter">
					${this._calcCount(this.graphic.singleInstance, this.instances)}
				</div>
				<div id="urlAndResolution">
					<a
						id="url"
						href=${fullUrl}
						target="_blank"
						title=${this._calcShortUrl(this.graphic.url)}
					>
						${this._calcShortUrl(this.graphic.url)}
					</a>
					<div id="resolution">
						${this.graphic.width}x${this.graphic.height}
					</div>
				</div>
				<button
					id="copyButton"
					data-clipboard-text=${fullUrl}
				>
					${icon("content-copy")}
					<span class="copyButton-text">&nbsp;Copy URL</span>
				</button>
				<button
					id="reloadButton"
					@click=${this.reloadAll}
					?disabled=${this._calcReloadAllDisabled(this.instances)}
				>
					${icon("refresh")}
					<span class="reloadButton-text">&nbsp;Reload</span>
				</button>
				<button id="collapseButton" @click=${this.toggleCollapse}>
					${icon(this._collapseOpened ? "unfold-less" : "unfold-more")}
				</button>
			</div>

			<div class="instances-collapse ${this._collapseOpened ? "open" : ""}">
				${this.instances.map(
					(instance) => html`
						<ncg-graphic-instance
							responsive-mode=${this.responsiveMode}
							.graphic=${this.graphic}
							.instance=${instance}
						></ncg-graphic-instance>
					`,
				)}
			</div>
		`;
	}
}

customElements.define("ncg-graphic", NcgGraphic);
