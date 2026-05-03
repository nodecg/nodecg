import "./ncg-graphic-instance-diff";
import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../../css/nodecg-theme";
import { icon } from "../../icons";
import type { NodeCG } from "../../../../types/nodecg";

const pulseElement = document.createElement("div");
setInterval(() => {
	pulseElement.dispatchEvent(
		new CustomEvent("pulse", { detail: { timestamp: Date.now() } }),
	);
}, 1000);

class NcgGraphicInstance extends LitElement {
	static override properties = {
		responsiveMode: { type: String, reflect: true },
		graphic: { type: Object },
		instance: { type: Object },
		status: { type: String, reflect: true },
		statusHover: { type: Boolean, reflect: true },
	};

	responsiveMode = "";
	graphic: NodeCG.Bundle.Graphic | null = null;
	instance: NodeCG.GraphicsInstance | null = null;
	status = "";
	statusHover = false;
	private _offTimeout: ReturnType<typeof setTimeout> | null = null;

	static override styles = [
		nodecgTheme,
		css`
			:host {
				display: flex;
				flex-direction: row;
				flex: none;
				box-sizing: border-box;
				font-size: 18px;
				font-weight: 500;
				height: 35px;
				margin-bottom: 5px;
				margin-left: 8px;
				margin-right: 8px;
				position: relative;
				white-space: nowrap;
			}

			:host(:first-child) {
				margin-top: 5px;
			}

			#indicator {
				flex: none;
				background-color: #cacaca;
				width: 8px;
			}

			:host([status="nominal"]) #indicator {
				background-color: #00a651;
			}

			:host([status="out-of-date"]) #indicator {
				background-color: #ffc700;
			}

			#indicatorIcon {
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: center;
				flex: none;
				background: #525f78;
				border-right: 1px solid #6f7d99;
				width: 38px;
				cursor: default;
			}

			:host([status="nominal"]) #indicatorIcon {
				color: #00a651;
			}

			:host([status="out-of-date"]) #indicatorIcon,
			:host([status="out-of-date"]) #status {
				color: #ffc700;
			}

			:host([status="out-of-date"]) #status {
				cursor: help;
			}

			#ip,
			#status,
			#duration {
				display: flex;
				flex-direction: row;
				align-items: center;
				background: #525f78;
				padding: 0 16px;
			}

			#ip {
				flex: 1;
				border-right: 1px solid #6f7d99;
				min-width: 0;
			}

			#ip-actual {
				overflow: hidden;
				text-overflow: ellipsis;
			}

			#status {
				flex: none;
				border-right: 1px solid #6f7d99;
				width: 187px;
			}

			#duration {
				flex: none;
				width: 120px;
				margin-right: 1px;
				gap: 6px;
			}

			button {
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: center;
				flex: none;
				background: var(--btn-color, #6155bd);
				border: none;
				border-radius: 0;
				color: white;
				cursor: pointer;
				margin: 0 1px;
				min-width: 0;
				padding: 0;
				width: 40px;
			}

			button:last-child {
				margin-right: 0;
			}

			button:disabled {
				opacity: 0.5;
				cursor: default;
			}

			#killButton {
				--btn-color: #ff7575;
			}

			#diff {
				transition: opacity 150ms ease-in-out;
				z-index: 1;
				top: 38px;
				left: 40px;
			}

			:host([responsive-mode="medium"]) #status {
				width: 94px;
			}

			:host([responsive-mode="medium"]) #duration {
				width: 100px;
			}

			:host(:not([responsive-mode="wide"])) #ip,
			:host(:not([responsive-mode="wide"])) #status,
			:host(:not([responsive-mode="wide"])) #duration {
				padding: 0 12px;
			}

			:host([responsive-mode="narrow"]) #status {
				width: 91px;
			}

			:host([responsive-mode="narrow"]) #duration {
				width: 69px;
			}

			:host([responsive-mode="narrow"]) #status,
			:host([responsive-mode="narrow"]) #duration-icon {
				display: none;
			}

			:host([responsive-mode="narrow"]) #diff {
				left: 0;
			}

			:host([status="closed"]) {
				opacity: 0;
				transition: opacity 0.9s ease-out;
			}

			ncg-graphic-instance-diff {
				position: absolute;
			}

			:host(:not([status="out-of-date"])) ncg-graphic-instance-diff,
			:host(:not([status-hover])) ncg-graphic-instance-diff {
				display: none;
				opacity: 0;
				pointer-events: none;
			}

			:host([status="out-of-date"][status-hover]) ncg-graphic-instance-diff {
				display: flex;
				opacity: 1;
				pointer-events: initial;
			}
		`,
	];

	override firstUpdated() {
		pulseElement.addEventListener("pulse", () => {
			this.requestUpdate();
		});

		const showDiff = () => {
			if (this._offTimeout) { clearTimeout(this._offTimeout); this._offTimeout = null; }
			this.statusHover = true;
		};

		const hideDiff = (immediate: boolean) => {
			if (immediate) {
				if (this._offTimeout) { clearTimeout(this._offTimeout); this._offTimeout = null; }
				this.statusHover = false;
			} else if (!this._offTimeout) {
				this._offTimeout = setTimeout(() => {
					this._offTimeout = null;
					this.statusHover = false;
				}, 250);
			}
		};

		const indicatorIcon = this.shadowRoot!.querySelector<HTMLDivElement>("#indicatorIcon")!;
		const statusEl = this.shadowRoot!.querySelector<HTMLDivElement>("#status")!;
		const diffEl = this.shadowRoot!.querySelector<HTMLElement>("ncg-graphic-instance-diff")!;

		indicatorIcon.addEventListener("mouseenter", () => { if (this.responsiveMode === "narrow") showDiff(); });
		statusEl.addEventListener("mouseenter", showDiff);
		diffEl.addEventListener("mouseenter", showDiff);

		indicatorIcon.addEventListener("mouseleave", () => { if (this.responsiveMode === "narrow") hideDiff(false); });
		statusEl.addEventListener("mouseleave", () => hideDiff(false));
		diffEl.addEventListener("mouseleave", () => hideDiff(false));
		diffEl.addEventListener("close", () => hideDiff(true));
	}

	override updated(changedProps: Map<string, unknown>) {
		if (changedProps.has("instance")) {
			this.status = this._computeStatus(this.instance ?? undefined);
		}
	}

	private reload() {
		if (!this.instance) return;
		const btn = this.shadowRoot!.querySelector<HTMLButtonElement>("#reloadButton")!;
		btn.disabled = true;
		window.socket.emit("graphic:requestRefresh", this.instance, () => {
			btn.disabled = false;
		});
	}

	private kill() {
		if (!this.instance) return;
		const btn = this.shadowRoot!.querySelector<HTMLButtonElement>("#killButton")!;
		btn.disabled = true;
		window.socket.emit("graphic:requestKill", this.instance, () => {
			btn.disabled = false;
		});
	}

	private _computeStatus(instance?: NodeCG.GraphicsInstance) {
		if (!instance) return "";
		if (!instance.open) return "closed";
		return instance.potentiallyOutOfDate ? "out-of-date" : "nominal";
	}

	private _calcIndicatorIcon(status: string) {
		switch (status) {
			case "nominal": return "check";
			case "out-of-date": return "warning";
			default: return "close";
		}
	}

	private _calcStatusMessage(status: string, responsiveMode: string) {
		switch (status) {
			case "nominal": return "Latest";
			case "out-of-date":
				return responsiveMode === "wide" ? "Potentially Out of Date" : "Out of Date";
			case "closed": return "Closed";
			default: return "Error";
		}
	}

	override render() {
		return html`
			<div id="indicator"></div>
			<div id="indicatorIcon">
				${icon(this._calcIndicatorIcon(this.status))}
			</div>
			<div id="ip">
				<div id="ip-actual" title=${this.instance?.ipv4 ?? ""}>
					${this.instance?.ipv4 ?? ""}
				</div>
			</div>
			<div id="status">
				${this._calcStatusMessage(this.status, this.responsiveMode)}
			</div>
			<div id="duration">
				<span id="duration-icon">${icon("access-time", 20)}</span>
				<span>${timeSince(this.instance?.timestamp ?? 0)}</span>
			</div>
			<button id="reloadButton" @click=${this.reload}>
				${icon("refresh")}
			</button>
			<button
				id="killButton"
				@click=${this.kill}
				?hidden=${!this.graphic?.singleInstance}
			>
				${icon("close")}
			</button>
			<ncg-graphic-instance-diff
				id="diff"
				.instance=${this.instance}
			></ncg-graphic-instance-diff>
		`;
	}
}

customElements.define("ncg-graphic-instance", NcgGraphicInstance);

function timeSince(date: number) {
	const seconds = Math.floor(Date.now() / 1000 - date / 1000);
	let interval = Math.floor(seconds / 31536000);
	if (interval > 1) return `${interval} year`;
	interval = Math.floor(seconds / 2592000);
	if (interval > 1) return `${interval} month`;
	interval = Math.floor(seconds / 86400);
	if (interval >= 1) return `${interval} day`;
	interval = Math.floor(seconds / 3600);
	if (interval >= 1) return `${interval} hour`;
	interval = Math.floor(seconds / 60);
	if (interval > 1) return `${interval} min`;
	return `${Math.floor(seconds)} sec`;
}
