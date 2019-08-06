import '@polymer/iron-flex-layout/iron-flex-layout.js';
import * as Polymer from '@polymer/polymer';
class UtilScrollable extends Polymer.PolymerElement {
	static get template() {
		return Polymer.html`
		<style include="nodecg-theme">
			:host {
				display: block;
				@apply --layout-relative;
			}

			:host(.is-scrolled:not(:first-child))::before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				height: 1px;
				background: #dbdbdb;
			}

			:host(.can-scroll:not(.scrolled-to-bottom):not(:last-child))::after {
				content: '';
				position: absolute;
				bottom: 0;
				left: 0;
				right: 0;
				height: 1px;
				background: #dbdbdb;
			}

			.scrollable {
				padding: 0 24px;
				@apply --layout-scroll;
				@apply --util-scrollable;
			}
		</style>

		<div id="scrollable" class="scrollable" on-scroll="updateScrollState">
			<slot></slot>
		</div>
`;
	}

	static get is() {
		return 'util-scrollable';
	}

	/**
	 * Returns the scrolling element.
	 */
	get scrollTarget() {
		return this.$.scrollable;
	}

	attached() {
		requestAnimationFrame(this.updateScrollState.bind(this));
	}

	updateScrollState() {
		this.classList.toggle('is-scrolled', this.scrollTarget.scrollTop > 0);
		this.classList.toggle('can-scroll', this.scrollTarget.offsetHeight < this.scrollTarget.scrollHeight);
		this.classList.toggle('scrolled-to-bottom',
			this.scrollTarget.scrollTop + this.scrollTarget.offsetHeight >= this.scrollTarget.scrollHeight);
	}
}

customElements.define('util-scrollable', UtilScrollable);
