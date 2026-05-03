import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../../css/nodecg-theme";

export class UiSelect extends LitElement {
	static override properties = {
		name: { type: String },
		required: { type: Boolean },
		label: { type: String },
		value: { type: String },
	};

	name = "";
	required = false;
	label = "";
	value = "";

	static override styles = [
		nodecgTheme,
		css`
			:host {
				display: block;
				position: relative;
			}

			#label {
				color: #a9a9a9;
				cursor: default;
				left: 12px;
				pointer-events: none;
				position: absolute;
				top: 11px;
				user-select: none;
			}

			select {
				-moz-appearance: none;
				-webkit-appearance: none;
				appearance: none;
				background-color: #525f78;
				background-image: url("/dashboard/img/select-arrow.png");
				background-position: calc(93% + 2px) 8px;
				background-repeat: no-repeat;
				border: none;
				border-bottom: 1px solid white;
				box-sizing: border-box;
				color: inherit;
				font-family: inherit;
				font-size: inherit;
				font-weight: inherit;
				height: 100%;
				padding: 2px 6px;
				width: 100%;
			}

			select:focus {
				outline: 1px solid var(--nodecg-brand-blue);
			}
		`,
	];

	private get _select(): HTMLSelectElement {
		return this.shadowRoot!.querySelector<HTMLSelectElement>("select")!;
	}

	item(index: number) {
		return this._select.item(index);
	}

	add(option: HTMLOptionElement, before?: HTMLElement | number) {
		this._select.add(option, before as any);
	}

	removeOptionAt(index: number) {
		this._select.remove(index);
	}

	get selectedOptions() {
		return this._select?.selectedOptions;
	}

	set selectedOptions(_v: HTMLCollectionOf<HTMLOptionElement>) {
		// read-only on native select; setter kept for compatibility
	}

	override firstUpdated() {
		if (this.label) {
			const labelOption = document.createElement("option");
			labelOption.label = `-- Select a ${this.label} --`;
			labelOption.value = "";
			this._select.add(labelOption);
		}

		const options = this.querySelectorAll("option");
		options.forEach((option) => this._select.add(option));

		this._select.selectedIndex = -1;
	}

	private _selectChanged(e: Event) {
		const select = e.target as HTMLSelectElement;
		if (!select.value) {
			select.selectedIndex = -1;
		}
		this.value = select.value;
		this.dispatchEvent(new CustomEvent("change", { bubbles: true, composed: true }));
	}

	override render() {
		return html`
			<div id="label" ?hidden=${!!this.value}>${this.label}</div>
			<select
				.name=${this.name}
				title=${this.label}
				?required=${this.required}
				@change=${this._selectChanged}
			></select>
		`;
	}
}

customElements.define("ui-select", UiSelect);
