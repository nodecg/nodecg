import '@polymer/paper-toast/paper-toast.js';

// These get elided unless we do this hacky stuff to force typescript and webpack to keep them.
import * as keep1 from './ncg-graphics-bundle';
keep1;

import * as Polymer from '@polymer/polymer';
import { MutableData } from '@polymer/polymer/lib/mixins/mutable-data';

/**
 * @customElement
 * @polymer
 * @appliesMixin MutableData
 */
class NcgGraphics extends MutableData(Polymer.PolymerElement) {
	static get template() {
		return Polymer.html`
		<style include="nodecg-theme">
			:host {
				@apply --layout-vertical;
				font-family: Roboto, Noto, sans-serif;
				max-width: 800px;
				width: 100%;
			}
		</style>

		<template is="dom-repeat" items="[[bundlesWithGraphics]]" as="bundle" mutable-data="">
			<ncg-graphics-bundle bundle="[[bundle]]" instances="[[_graphicInstances]]">
			</ncg-graphics-bundle>
		</template>

		<paper-toast id="copyToast"></paper-toast>
`;
	}

	static get is() {
		return 'ncg-graphics';
	}

	static get properties() {
		return {
			bundlesWithGraphics: {
				type: Array,
				value: window.__renderData__.bundles.filter((bundle) => bundle.graphics && bundle.graphics.length > 0),
			},
			_graphicInstances: Array,
		};
	}

	override ready(): void {
		super.ready();
		const instancesRep = NodeCG.Replicant('graphics:instances', 'nodecg');

		instancesRep.on('change', (newVal) => {
			this['_graphicInstances'] = newVal;
		});

		this.addEventListener('url-copy-success', () => {
			this.$['copyToast'].show('Graphic URL copied to clipboard.');
		});
		this.addEventListener('url-copy-error', () => {
			this.$['copyToast'].show('Failed to copy graphic URL to clipboard!');
		});
	}
}

customElements.define('ncg-graphics', NcgGraphics);
