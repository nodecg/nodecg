import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-toast/paper-toast.js';
import * as Polymer from '@polymer/polymer';
class NcgSettings extends Polymer.PolymerElement {
	static get template() {
		return Polymer.html`
		<style include="nodecg-theme">
			:host {
				@apply --layout-vertical;
				max-width: 600px;
				width: 100%;
			}

			.card-actions {
				padding: 0;
				padding-top: 8px;
				@apply --layout-horizontal;
				@apply --layout-center;
				@apply --layout-end-justified;
			}

			paper-button {
				@apply --layout-horizontal;
				@apply --layout-center-center;
			}

			paper-button iron-icon {
				margin-right: 0.5em;
			}

			paper-button span {
				white-space: nowrap;
			}

			paper-button:first-of-type {
				margin-left: 0;
			}

			paper-button:last-of-type {
				margin-right: 0;
			}

			@media (max-width: 400px) {
				paper-button iron-icon {
					display: none;
				}
			}
		</style>

		<paper-card heading="Your Key">
			<div class="card-content">
				<p class="paper-font-body1" style="margin-top: 0; padding: 0">
					Resetting your key will disrupt all current sessions using it.<br>
					When you reset your key, the dashboard will be refreshed so that a new key can be obtained.
				</p>
				<div class="card-actions">
					<paper-button raised="" id="copyKey" class="nodecg-benign">
						<iron-icon icon="icons:content-copy"></iron-icon>
						<span>Copy Key</span>
					</paper-button>
					<paper-button raised="" id="showKey" class="nodecg-configure" title="Show Key" on-tap="openShowKeyDialog">
						<iron-icon icon="communication:vpn-key"></iron-icon>
						<span>Show Key</span>
					</paper-button>
					<paper-button raised="" id="resetKey" class="nodecg-reject" on-tap="openResetKeyDialog">
						<iron-icon icon="icons:refresh"></iron-icon>
						<span>Reset Key</span>
					</paper-button>
				</div>
			</div>
		</paper-card>

		<!-- 2017/03/18: Had to remove with-backdrop during the dashboard re-write -->
		<paper-dialog id="showKeyDialog">
			<h2>NodeCG Key</h2>
			<div>
				<code id="key" class="paper-font-code1"></code>
				<p class="text-warning paper-font-body1">
					<b>Do not</b> give this key to anyone or show it on stream!<br>
					If you accidentally reveal it, <b>reset it immediately!</b>
				</p>
			</div>
			<div class="buttons">
				<paper-button dialog-dismiss="dialog-dismiss">Close</paper-button>
			</div>
		</paper-dialog>

		<paper-dialog id="resetKeyDialog">
			<h2>Reset NodeCG Key</h2>
			<div>
				<p class="text-warning paper-font-body1">
					Are you sure you wish to reset your <b>NodeCG key</b>?<br>
					Doing so will invalidate all URLs currently loaded into your streaming software!
				</p>
			</div>
			<div class="buttons">
				<paper-button dialog-dismiss="dialog-dismiss">No, Cancel</paper-button>
				<paper-button dialog-dismiss="dialog-confirm" on-tap="resetKey">Yes, reset</paper-button>
			</div>
		</paper-dialog>

		<paper-toast id="settingsToast"></paper-toast>
`;
	}

	static get is() {
		return 'ncg-settings';
	}

	static get properties() {
		return {};
	}

	ready() {
		super.ready();

		if (window.ncgConfig.login.enabled && window.token) {
			this.$.key.textContent = window.token;
			this.$.copyKey.setAttribute('data-clipboard-text', window.token);
		}

		const clipboard = new window.ClipboardJS(this.$.copyKey);
		clipboard.on('success', /* istanbul ignore next: hard to test clipboard things */() => {
			this.$.settingsToast.show('Key copied to clipboard.');
		});
	}

	/* istanbul ignore next: trivial */
	openShowKeyDialog() {
		this.$.showKeyDialog.open();
	}

	/* istanbul ignore next: trivial */
	openResetKeyDialog() {
		this.$.resetKeyDialog.open();
	}

	resetKey() {
		window.socket.emit('regenerateToken', window.token, /* istanbul ignore next */err => {
			if (err) {
				console.error(err);
				return;
			}

			document.location.reload();
		});
	}
}

customElements.define('ncg-settings', NcgSettings);
