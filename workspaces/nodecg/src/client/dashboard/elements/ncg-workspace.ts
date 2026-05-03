import "./ncg-dashboard-panel";
import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../css/nodecg-theme";
import Draggabilly from "draggabilly";
import Packery from "packery";
import type { NodeCG } from "../../../types/nodecg";
import type { NcgDashboardPanel } from "./ncg-dashboard-panel";

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

class NcgWorkspace extends LitElement {
	static override properties = {
		workspace: { type: Object },
		panels: { type: Array },
		fullbleed: { type: Boolean, reflect: true },
		route: { type: Object },
	};

	workspace: NodeCG.Workspace | null = null;
	panels: NodeCG.Bundle.Panel[] = [];
	fullbleed = false;
	route: string = "";

	private _packery: InstanceType<typeof Packery> | null = null;
	private _packeryInitialized = false;
	private _initialized = false;
	private _panelMutationObserver: MutationObserver | null = null;
	private _shiftPackery: () => void;
	private _applyPackery: () => void;
	private _fixPackery: () => void;
	private _debouncedMutation: () => void;
	private PANEL_SORT_ORDER_STORAGE_KEY = "";

	constructor() {
		super();
		this._shiftPackery = debounce(() => {
			if (this._packeryInitialized) this._packery!.shiftLayout();
		}, 100);
		this._applyPackery = debounce(() => {
			if (this._packeryInitialized) this._packery!.layout();
		}, 10);
		this._fixPackery = debounce(() => {
			this._applyPackery();
		}, 10);
		this._debouncedMutation = debounce(() => {
			this._panelMutationObserver?.disconnect();
			this._shiftPackery();
			this._startObservingPanelMutations();
		}, 150);
	}

	static override styles = [
		nodecgTheme,
		css`
			:host {
				display: block;
				width: 100%;
				height: 100%;
				pointer-events: none;
				box-sizing: border-box;
			}

			#panels {
				transform: translateY(40px);
				opacity: 0;
				transition:
					opacity 500ms ease,
					transform 600ms ease-out;
				width: 100%;
				height: 100%;
			}

			:host(:not([fullbleed])) {
				padding: 32px;
			}

			:host(:not([fullbleed])) #panels {
				padding-bottom: 32px;
			}

			.spinner-wrapper {
				position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
			}

			.spinner {
				width: 68px;
				height: 68px;
				border-radius: 50%;
				border: 5px solid transparent;
				border-top-color: #645ba6;
				border-right-color: #a50074;
				animation: spin 1.2s linear infinite;
			}

			@keyframes spin {
				to { transform: rotate(360deg); }
			}

			iframe {
				display: block;
				width: 100%;
				height: 100%;
			}
		`,
	];

	override updated(changedProps: Map<string, unknown>) {
		if (changedProps.has("workspace") && this.workspace) {
			this.panels = this._computePanels(this.workspace);
			this.fullbleed = this.workspace?.fullbleed ?? false;
			this.PANEL_SORT_ORDER_STORAGE_KEY =
				(this.workspace.route === "" ? "default" : this.workspace.name) +
				"_workspace_panel_sort_order";
		}
		if (changedProps.has("route") && this._packeryInitialized) {
			this._fixPackery();
		}
	}

	override firstUpdated() {
		if (document.readyState === "complete") {
			this._init();
		} else {
			window.addEventListener("load", () => this._init());
		}

		if (!this.fullbleed) {
			this._initPackery();
			this._startObservingPanelMutations();
		}
	}

	private _init() {
		if (this._initialized) return;
		this._initialized = true;

		const spinner = this.shadowRoot?.querySelector<HTMLDivElement>(".spinner-wrapper");
		if (spinner) spinner.style.display = "none";

		this._applyPackery();

		setTimeout(() => {
			this.addEventListener("click", this._shiftPackery);
			const panels = this.shadowRoot?.querySelector<HTMLDivElement>("#panels");
			if (panels) {
				panels.style.opacity = "1";
				panels.style.transform = "translateY(0)";
				panels.style.pointerEvents = "auto";
			}
		}, 750);
	}

	private _startObservingPanelMutations() {
		if (this._panelMutationObserver) return;
		try {
			this._panelMutationObserver = new MutationObserver(this._debouncedMutation);
			const panelsEl = this.shadowRoot?.querySelector<HTMLDivElement>("#panels");
			if (panelsEl) {
				this._panelMutationObserver.observe(panelsEl, {
					subtree: true,
					attributes: true,
					childList: true,
					characterData: true,
				});
			}
		} catch {
			console.warn(
				"MutationObserver not supported; panel layout may be less responsive",
			);
		}
	}

	private _initPackery() {
		const panelsEl = this.shadowRoot?.querySelector<HTMLDivElement>("#panels");
		if (!panelsEl) return;

		const packery = new Packery(panelsEl, {
			itemSelector: "ncg-dashboard-panel",
			columnWidth: 128,
			gutter: 16,
			isInitLayout: false,
			containerStyle: { position: "relative" },
		});

		this._packery = packery;

		const sortOrder: string[] = [];
		const rawStored = localStorage.getItem(this.PANEL_SORT_ORDER_STORAGE_KEY);
		if (rawStored) {
			const storedOrder: string[] = JSON.parse(rawStored);
			const itemsByFullName: Record<string, (typeof packery.items)[number]> = {};
			const allPanels: string[] = [];

			for (let i = 0; i < packery.items.length; i++) {
				const item = packery.items[i]!;
				const panelName = item.element.getAttribute("panel");
				const bundleName = item.element.getAttribute("bundle");
				const fullName = `${bundleName}.${panelName}`;
				allPanels[i] = fullName;
				itemsByFullName[fullName] = item;
			}

			const merged = arrayUnique(storedOrder.concat(allPanels)).filter((v) =>
				allPanels.includes(v),
			);

			for (let i = 0; i < merged.length; i++) {
				const name = merged[i]!;
				if (itemsByFullName[name]) packery.items[i] = itemsByFullName[name]!;
			}
		}

		packery.layout();
		this._packeryInitialized = true;

		const panelsList =
			panelsEl.querySelectorAll<NcgDashboardPanel>("ncg-dashboard-panel");
		panelsList.forEach((itemElem) => {
			const draggie = new Draggabilly(itemElem);
			const handle = itemElem.dragHandle;
			if (handle) draggie.handles = [handle];
			packery.bindDraggabillyEvents(draggie);
		});

		packery.on("dragItemPositioned", () => {
			setTimeout(() => packery.layout(), 100);
		});

		const orderItems = () => {
			const itemElems = packery.getItemElements();
			sortOrder.length = 0;
			for (let i = 0; i < itemElems.length; i++) {
				sortOrder[i] = `${itemElems[i]!.getAttribute("bundle")}.${itemElems[i]!.getAttribute("panel")}`;
			}
			localStorage.setItem(
				this.PANEL_SORT_ORDER_STORAGE_KEY,
				JSON.stringify(sortOrder),
			);
		};

		packery.on("layoutComplete", orderItems);
		packery.on("dragItemPositioned", orderItems);
	}

	private _computePanels(workspace: NodeCG.Workspace): NodeCG.Bundle.Panel[] {
		const workspaceName =
			workspace.route === "" ? "default" : workspace.name;
		const panels: NodeCG.Bundle.Panel[] = [];
		window.__renderData__.bundles.forEach((bundle) => {
			bundle.dashboard.panels.forEach((panel) => {
				if (panel.dialog) return;
				if (panel.fullbleed) {
					if (
						workspaceName ===
						`__nodecg_fullbleed__${bundle.name}_${panel.name}`
					) {
						panels.push(panel);
					}
					return;
				}
				if (panel.workspace === workspaceName) {
					panels.push(panel);
				}
			});
		});
		return panels;
	}

	override render() {
		return html`
			<div id="panels">
				${this.panels.map(
					(panel) => html`
						<ncg-dashboard-panel
							id="${panel.bundleName}_${panel.name}"
							display-title=${panel.title}
							bundle=${panel.bundleName}
							panel=${panel.name}
							header-color=${panel.headerColor ?? ""}
							width=${panel.width}
							?fullbleed=${panel.fullbleed}
							@transitioning-changed=${(e: CustomEvent) => {
								if (!e.detail.value) this._shiftPackery();
							}}
						>
							<iframe
								src="/bundles/${panel.bundleName}/dashboard/${panel.file}"
								frameborder="0"
								scrolling=${panel.fullbleed ? "yes" : "no"}
								id="${panel.bundleName}_${panel.name}_iframe"
								?fullbleed=${panel.fullbleed}
								loading="lazy"
								@iframe-resized=${this._shiftPackery}
							></iframe>
						</ncg-dashboard-panel>
					`,
				)}
			</div>
			<div class="spinner-wrapper">
				<div class="spinner"></div>
			</div>
		`;
	}
}

customElements.define("ncg-workspace", NcgWorkspace);

function arrayUnique<T>(array: T[]): T[] {
	const a = array.concat();
	for (let i = 0; i < a.length; ++i) {
		for (let j = i + 1; j < a.length; ++j) {
			if (a[i] === a[j]) a.splice(j--, 1);
		}
	}
	return a;
}
