import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../css/nodecg-theme";

class UtilScrollable extends LitElement {
	static override styles = [
		nodecgTheme,
		css`
			:host {
				display: block;
				position: relative;
			}

			:host(.is-scrolled:not(:first-child))::before {
				content: "";
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				height: 1px;
				background: #dbdbdb;
			}

			:host(.can-scroll:not(.scrolled-to-bottom):not(:last-child))::after {
				content: "";
				position: absolute;
				bottom: 0;
				left: 0;
				right: 0;
				height: 1px;
				background: #dbdbdb;
			}

			.scrollable {
				padding: 0 24px;
				overflow: auto;
			}
		`,
	];

	get scrollTarget(): HTMLDivElement {
		return this.shadowRoot!.querySelector<HTMLDivElement>(".scrollable")!;
	}

	override firstUpdated() {
		requestAnimationFrame(() => this.updateScrollState());
	}

	updateScrollState() {
		const t = this.scrollTarget;
		this.classList.toggle("is-scrolled", t.scrollTop > 0);
		this.classList.toggle(
			"can-scroll",
			t.offsetHeight < t.scrollHeight,
		);
		this.classList.toggle(
			"scrolled-to-bottom",
			t.scrollTop + t.offsetHeight >= t.scrollHeight,
		);
	}

	override render() {
		return html`
			<div class="scrollable" @scroll=${this.updateScrollState}>
				<slot></slot>
			</div>
		`;
	}
}

customElements.define("util-scrollable", UtilScrollable);
