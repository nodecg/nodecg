import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-spinner/paper-spinner-lite.js';
import * as Polymer from '@polymer/polymer';
class NcgAssetFile extends Polymer.PolymerElement {
	static get template() {
		return Polymer.html`
		<style include="nodecg-theme">
			:host {
				@apply --layout-center;
				@apply --layout-horizontal;
				@apply --layout-justified;
				margin: 4px 0;
			}

			#name {
				line-height: 24px;
				overflow: hidden;
				text-overflow: ellipsis;
				text-transform: none;
			}

			#delete {
				align-items: center;
				display: flex;
				flex-shrink: 0;
				margin-right: 21px;
			}

			#spinner {
				--paper-spinner-color: var(--nodecg-reject-color);
				pointer-events: none;
				position: absolute;
				right: 78px;
			}
		</style>

		<a id="name" href="[[file.url]]" target="_blank">[[file.base]]</a>
		<paper-spinner-lite id="spinner" alt="Deleting" active=""></paper-spinner-lite>
		<paper-button id="delete" class="nodecg-reject" on-click="_handleDeleteClick">
			<iron-icon icon="delete"></iron-icon>
			&nbsp;Delete
		</paper-button>
`;
	}

	static get is() {
		return 'ncg-asset-file';
	}

	static get properties() {
		return {
			deleting: {
				type: Boolean,
				observer: '_deletingChanged',
				value: false
			}
		};
	}

	_deletingChanged(newVal) {
		this.$.spinner.style.display = newVal ? 'block' : 'none';
		this.$.delete.style.visibility = newVal ? 'hidden' : 'visible';
	}

	_handleDeleteClick() {
		this.deleting = true;

		fetch(this.file.url, {
			method: 'DELETE',
			credentials: 'include'
		}).then(response => {
			if (response.status === 410 || response.status === 200) {
				this.dispatchEvent(new CustomEvent('deleted', {bubbles: true, composed: true}));
			} else {
				this.dispatchEvent(new CustomEvent('deletion-failed', {bubbles: true, composed: true}));
			}

			this.deleting = false;
		});
	}
}

customElements.define('ncg-asset-file', NcgAssetFile);
