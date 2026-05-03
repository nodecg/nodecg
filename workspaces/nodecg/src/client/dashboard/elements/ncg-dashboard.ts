import "../css/nodecg-theme";
import "./assets/ncg-assets";
import "./graphics/ncg-graphics";
import "./mixer/ncg-mixer";
import "./ncg-dialog";
import "./ncg-workspace";
import "./settings/ncg-settings";

import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../css/nodecg-theme";
import { icon } from "../icons";
import type { NodeCG } from "../../../types/nodecg";

function debounce(fn: () => void, delay: number): () => void {
	let timer: ReturnType<typeof setTimeout> | null = null;
	return () => {
		if (timer !== null) clearTimeout(timer);
		timer = setTimeout(() => {
			timer = null;
			fn();
		}, delay);
	};
}

class NcgDashboard extends LitElement {
	static override properties = {
		_route: { state: true },
		_smallScreen: { state: true },
		_drawerOpen: { state: true },
		_mainToastText: { state: true },
		_mainToastVisible: { state: true },
		_reconnectToastVisible: { state: true },
	};

	private _route = "";
	private _smallScreen = false;
	private _drawerOpen = false;
	private _mainToastText = "";
	private _mainToastVisible = false;
	private _reconnectToastVisible = false;
	private _toastTimer: ReturnType<typeof setTimeout> | null = null;
	private _fixPathDebounce: (() => void);

	private readonly _loginDisabled = !window.ncgConfig.login?.enabled;
	private readonly _workspaces = window.__renderData__.workspaces;
	private readonly _bundles = window.__renderData__.bundles;

	private readonly _pages = (() => {
		const pages: { name: string; route: string; iconName: string }[] = [
			{ name: "Graphics", route: "graphics", iconName: "visibility" },
			{ name: "Mixer", route: "mixer", iconName: "volume-up" },
			{ name: "Assets", route: "assets", iconName: "file-upload" },
		];
		if (window.ncgConfig.login?.enabled) {
			pages.push({ name: "Settings", route: "settings", iconName: "settings" });
		}
		return pages;
	})();

	constructor() {
		super();
		this._fixPathDebounce = debounce(() => this._fixPath(), 100);
	}

	static override styles = [
		nodecgTheme,
		css`
			:host {
				-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
				position: fixed;
				top: 0;
				right: 0;
				bottom: 0;
				left: 0;
				overflow: hidden;
				display: flex;
				flex-direction: column;
			}

			header {
				background-color: #2f3a4f;
				display: flex;
				flex-direction: row;
				align-items: center;
				height: 64px;
				flex: none;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
				z-index: 10;
				padding: 0 8px;
				gap: 4px;
			}

			#mainLogo {
				height: 48px;
				width: 48px;
				flex: none;
			}

			.workspace-tabs {
				display: flex;
				flex-direction: row;
				align-items: center;
				height: 100%;
				flex: 1;
				overflow: hidden;
			}

			.page-tabs {
				display: flex;
				flex-direction: row;
				align-items: center;
				height: 100%;
				flex: none;
			}

			.tab {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				background: none;
				border: none;
				border-bottom: 5px solid transparent;
				color: white;
				cursor: pointer;
				font-size: 12px;
				font-weight: 500;
				height: 100%;
				padding: 0 12px;
				text-transform: uppercase;
				user-select: none;
				gap: 2px;
				white-space: nowrap;
			}

			.tab:hover {
				color: var(--nodecg-brand-blue);
			}

			.tab.active {
				border-bottom-color: var(--nodecg-brand-blue);
				color: var(--nodecg-brand-blue);
			}

			.workspace-tab {
				font-size: 16px;
			}

			.icon-btn {
				background: none;
				border: none;
				color: white;
				cursor: pointer;
				padding: 8px;
				display: flex;
				align-items: center;
				justify-content: center;
				flex: none;
			}

			#pages {
				flex: 1;
				display: flex;
				flex-direction: column;
				overflow: auto;
				box-sizing: border-box;
				height: 1px;
			}

			section {
				flex: 1;
				box-sizing: border-box;
				display: none;
			}

			section.active {
				display: flex;
				flex-direction: column;
				align-items: center;
			}

			section.section-workspace {
				height: 1px;
			}

			section.section-workspace.active {
				display: block;
			}

			section:not(.section-workspace).active {
				padding: 32px;
			}

			/* Drawer */
			.drawer-backdrop {
				position: fixed;
				inset: 0;
				background: rgba(0, 0, 0, 0.5);
				z-index: 100;
			}

			.drawer {
				position: fixed;
				top: 0;
				left: 0;
				bottom: 0;
				width: 288px;
				background-color: #2f3a4f;
				z-index: 101;
				display: flex;
				flex-direction: column;
				overflow-y: auto;
			}

			.drawer-toolbar {
				display: flex;
				flex-direction: row;
				align-items: center;
				padding: 8px;
				gap: 8px;
			}

			#drawerLogo {
				height: 28px;
				width: 83px;
			}

			.drawer-list {
				margin: 0 20px;
				list-style: none;
				padding: 0;
			}

			.drawer-list a {
				color: white;
				display: flex;
				flex-direction: row;
				align-items: center;
				gap: 12px;
				line-height: 40px;
				padding: 0 8px;
				text-decoration: none;
				text-transform: uppercase;
				font-size: 14px;
			}

			.drawer-list a.selected {
				background-color: #525f78;
				font-weight: bold;
			}

			#dialogs iframe {
				box-sizing: border-box;
				margin: 0 !important;
				padding: 0 !important;
				width: 100%;
			}

			/* Toast styles */
			.toast {
				position: fixed;
				bottom: 16px;
				left: 50%;
				transform: translateX(-50%);
				background: #323232;
				color: white;
				padding: 12px 24px;
				border-radius: 2px;
				z-index: 200;
				opacity: 0;
				transition: opacity 0.3s ease;
				pointer-events: none;
				white-space: nowrap;
			}

			.toast.visible {
				opacity: 1;
			}

			.reconnect-toast {
				position: fixed;
				bottom: 16px;
				left: 50%;
				transform: translateX(-50%);
				background: #323232;
				color: white;
				padding: 12px 24px;
				border-radius: 2px;
				z-index: 200;
				display: none;
				flex-direction: row;
				align-items: center;
				gap: 12px;
			}

			.reconnect-toast.visible {
				display: flex;
			}

			.reconnect-spinner {
				width: 20px;
				height: 20px;
				border-radius: 50%;
				border: 3px solid rgba(255, 255, 255, 0.3);
				border-top-color: white;
				animation: spin 0.8s linear infinite;
			}

			@keyframes spin {
				to { transform: rotate(360deg); }
			}

			[hidden] {
				display: none !important;
			}

			/* Mobile */
			@media (max-width: 640px) {
				section:not(.section-workspace).active {
					padding: 0 !important;
				}

				.workspace-tabs,
				.page-tabs {
					display: none;
				}

				#mainLogo {
					padding-left: 16px;
				}
			}
		`,
	];

	override connectedCallback() {
		super.connectedCallback();

		this._route = window.location.hash.slice(1) || "";
		window.addEventListener("hashchange", this._onHashChange);

		// Media query for small screen
		const mql = window.matchMedia("(max-width: 640px)");
		this._smallScreen = mql.matches;
		mql.addEventListener("change", (e) => {
			this._smallScreen = e.matches;
			if (!e.matches) this._drawerOpen = false;
		});

		// Default to first workspace if no route set
		if (
			this._route === "" &&
			window.__renderData__.workspaces[0]!.route !== ""
		) {
			window.location.hash = window.__renderData__.workspaces[0]!.route;
		}
	}

	override disconnectedCallback() {
		super.disconnectedCallback();
		window.removeEventListener("hashchange", this._onHashChange);
	}

	private _onHashChange = () => {
		this._route = window.location.hash.slice(1);
		this._fixPathDebounce();
	};

	override firstUpdated() {
		let FAIL_URI = "";
		let SUCCESS_URI = "";
		let notified = false;

		getImageDataURI("img/notifications/standard/fail.png", (_err, result) => {
			if (result) FAIL_URI = result.data;
		});
		getImageDataURI(
			"img/notifications/standard/success.png",
			(_err, result) => {
				if (result) SUCCESS_URI = result.data;
			},
		);

		window.socket.on("protocol_error", (err) => {
			if (err.type === "UnauthorizedError") {
				window.location.href = `/authError?code=${err.code}&message=${err.message}`;
			} else {
				console.error("Unhandled socket error:", err);
				this._showMainToast("Unhandled socket error!");
			}
		});

		window.socket.on("disconnect", () => {
			this._showMainToast("Lost connection to NodeCG server!");
			notified = false;
		});

		window.socket.io.on("reconnect_attempt", (attempts) => {
			this._reconnectToastVisible = true;
			if (attempts >= 3 && !notified) {
				notified = true;
				notify("Disconnected", {
					body: "The dashboard has lost connection with NodeCG.",
					icon: FAIL_URI,
					tag: "disconnect",
				});
			}
		});

		window.socket.io.on("reconnect", (attempts) => {
			this._showMainToast("Reconnected to NodeCG server!");
			this._reconnectToastVisible = false;

			if (attempts >= 3) {
				notify("Reconnected", {
					body: `Successfully reconnected on attempt # ${attempts}`,
					icon: SUCCESS_URI,
					tag: "reconnect",
				});
			}
		});

		window.socket.io.on("reconnect_failed", () => {
			this._showMainToast("Failed to reconnect to NodeCG server!");
			notify("Reconnection Failed", {
				body: "Could not reconnect to NodeCG after the maximum number of attempts.",
				icon: FAIL_URI,
				tag: "reconnect_failed",
			});
		});
	}

	private _showMainToast(text: string) {
		this._mainToastText = text;
		this._mainToastVisible = true;
		if (this._toastTimer !== null) clearTimeout(this._toastTimer);
		this._toastTimer = setTimeout(() => {
			this._mainToastVisible = false;
		}, 3000);
	}

	private _navigate(route: string) {
		window.location.hash = route;
	}

	private _openDrawer() {
		this._drawerOpen = true;
	}

	private _closeDrawer() {
		this._drawerOpen = false;
	}

	private _logout() {
		window.location.href = "/logout";
	}

	private _fixPath() {
		const allRoutes = [
			...this._workspaces.map((w) => w.route),
			...this._pages.map((p) => p.route),
		];
		if (!allRoutes.includes(this._route)) {
			window.location.hash = this._workspaces[0]!.route;
		}
	}

	private _computeDialogs(bundles: NodeCG.Bundle[]) {
		const dialogs: NodeCG.Bundle.Panel[] = [];
		bundles.forEach((bundle) => {
			bundle.dashboard.panels.forEach((panel) => {
				if (panel.dialog) dialogs.push(panel);
			});
		});
		return dialogs;
	}

	private _calcButtonClass(buttonType: string) {
		return buttonType === "confirm" ? "nodecg-accept" : "nodecg-reject";
	}

	override render() {
		const dialogs = this._computeDialogs(this._bundles);

		return html`
			<header>
				${this._smallScreen
					? html`
							<button class="icon-btn" @click=${this._openDrawer}>
								${icon("menu")}
							</button>
						`
					: ""}

				<img id="mainLogo" src="/dashboard/img/square-logo.png" alt="NodeCG" />

				${!this._smallScreen
					? html`
							<div class="workspace-tabs">
								${this._workspaces.map(
									(ws) => html`
										<button
											class="tab workspace-tab ${this._route === ws.route ? "active" : ""}"
											@click=${() => this._navigate(ws.route)}
										>
											${ws.label}
										</button>
									`,
								)}
							</div>
							<div class="page-tabs">
								${this._pages.map(
									(page) => html`
										<button
											class="tab ${this._route === page.route ? "active" : ""}"
											@click=${() => this._navigate(page.route)}
										>
											${icon(page.iconName)}
											${page.name}
										</button>
									`,
								)}
								${!this._loginDisabled
									? html`
											<button class="tab" @click=${this._logout}>
												${icon("exit-to-app")}
												Sign Out
											</button>
										`
									: ""}
							</div>
						`
					: ""}
			</header>

			<div id="pages">
				${this._workspaces.map(
					(ws) => html`
						<section
							class="section-workspace ${this._route === ws.route ? "active" : ""}"
						>
							<ncg-workspace
								.workspace=${ws}
								.route=${this._route}
							></ncg-workspace>
						</section>
					`,
				)}

				<section class="${this._route === "graphics" ? "active" : ""}">
					<ncg-graphics></ncg-graphics>
				</section>

				<section class="${this._route === "mixer" ? "active" : ""}">
					<ncg-mixer></ncg-mixer>
				</section>

				<section class="${this._route === "assets" ? "active" : ""}">
					<ncg-assets></ncg-assets>
				</section>

				<section class="${this._route === "settings" ? "active" : ""}">
					<ncg-settings></ncg-settings>
				</section>
			</div>

			<div id="dialogs">
				${dialogs.map(
					(dialog) => html`
						<ncg-dialog
							id="${dialog.bundleName}_${dialog.name}"
							bundle=${dialog.bundleName}
							panel=${dialog.name}
							width=${dialog.width}
						>
							${dialog.title ? html`<h2>${dialog.title}</h2>` : ""}
							<div class="dialog-scrollable">
								<iframe
									src="/bundles/${dialog.bundleName}/dashboard/${dialog.file}"
									frameborder="0"
									scrolling="no"
									id="${dialog.bundleName}_${dialog.name}_iframe"
									loading="lazy"
								></iframe>
							</div>
							${dialog.dialogButtons?.length
								? html`
										<div class="buttons">
											${dialog.dialogButtons.map(
												(btn) => html`
													<button
														class="${this._calcButtonClass(btn.type)}"
														?dialog-confirm=${btn.type === "confirm"}
														?dialog-dismiss=${btn.type === "dismiss"}
													>
														${btn.name}
													</button>
												`,
											)}
										</div>
									`
								: ""}
						</ncg-dialog>
					`,
				)}
			</div>

			${this._drawerOpen
				? html`
						<div class="drawer-backdrop" @click=${this._closeDrawer}></div>
						<nav class="drawer">
							<div class="drawer-toolbar">
								<button class="icon-btn" @click=${this._closeDrawer}>
									${icon("close")}
								</button>
								<img
									id="drawerLogo"
									src="/dashboard/img/horiz-logo-2x.png"
									alt="NodeCG"
								/>
							</div>
							<ul class="drawer-list">
								${this._workspaces.map(
									(ws) => html`
										<li>
											<a
												href="#${ws.route}"
												class="${this._route === ws.route ? "selected" : ""}"
												@click=${this._closeDrawer}
											>
												${icon("dashboard")}
												${ws.label}
											</a>
										</li>
									`,
								)}
								${this._pages.map(
									(page) => html`
										<li>
											<a
												href="#${page.route}"
												class="${this._route === page.route ? "selected" : ""}"
												@click=${this._closeDrawer}
											>
												${icon(page.iconName)}
												${page.name}
											</a>
										</li>
									`,
								)}
							</ul>
						</nav>
					`
				: ""}

			<div class="toast ${this._mainToastVisible ? "visible" : ""}">
				${this._mainToastText}
			</div>

			<div class="reconnect-toast ${this._reconnectToastVisible ? "visible" : ""}">
				Attempting to reconnect to NodeCG server...
				<div class="reconnect-spinner"></div>
			</div>
		`;
	}
}

function getImageDataURI(
	url: string,
	cb: (
		error: Error | undefined,
		result?: { image: HTMLImageElement; data: string },
	) => void,
) {
	const img = new Image();
	img.onload = function () {
		const canvas = document.createElement("canvas");
		canvas.width = img.width;
		canvas.height = img.height;
		const ctx = canvas.getContext("2d");
		if (!ctx) { cb(new Error("Could not create canvas context")); return; }
		ctx.drawImage(img, 0, 0);
		try {
			cb(undefined, { image: img, data: canvas.toDataURL() });
		} catch (e: unknown) {
			cb(e as Error);
		}
		canvas.remove();
	};
	try {
		img.src = url;
	} catch (e: unknown) {
		cb(e as Error);
	}
}

function notify(
	title: string,
	options: { body?: string; icon?: string; tag?: string } = {},
) {
	if (!("Notification" in window)) return;
	if (window.Notification.permission === "granted") {
		const n = new window.Notification(title, options);
		setTimeout(() => n.close(), 5000);
	} else if (window.Notification.permission !== "denied") {
		void window.Notification.requestPermission((permission) => {
			if (permission === "granted") {
				const n = new window.Notification(title, options);
				setTimeout(() => n.close(), 5000);
			}
		});
	}
}

customElements.define("ncg-dashboard", NcgDashboard);
