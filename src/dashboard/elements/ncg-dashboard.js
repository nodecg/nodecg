import '@polymer/app-layout/app-layout.js';
import '@polymer/app-route/app-location.js';
import '@polymer/app-route/app-route.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@polymer/iron-icons/av-icons.js';
import '@polymer/iron-icons/communication-icons.js';
import '@polymer/iron-icons/image-icons.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-image/iron-image.js';
import '@polymer/iron-media-query/iron-media-query.js';
import '@polymer/iron-pages/iron-pages.js';
import '@polymer/iron-selector/iron-selector.js';
import '@polymer/paper-dialog-scrollable/paper-dialog-scrollable.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-item/paper-icon-item.js';
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-toast/paper-toast.js';
import '@polymer/polymer/lib/elements/custom-style.js';
import {Debouncer} from '@polymer/polymer/lib/utils/debounce.js';
import * as Polymer from '@polymer/polymer';
import '../css/nodecg-theme.js';
import './assets/ncg-assets.js';
import './graphics/ncg-graphics.js';
import './mixer/ncg-mixer.js';
import './ncg-dialog.js';
import './ncg-workspace.js';
import './settings/ncg-settings.js';
import {timeOut} from '@polymer/polymer/lib/utils/async.js';
class NcgDashboard extends Polymer.PolymerElement {
	static get template() {
		return Polymer.html`
		<style include="nodecg-theme">
			:host {
				-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
				@apply --layout-fullbleed;
				overflow: hidden;
			}

			app-drawer-layout,
			app-header-layout {
				height: 100%;
			}

			app-header {
				background-color: #2F3A4F;
				--app-header-shadow: {
					box-shadow: inset 0 5px 6px -3px rgba(0, 0, 0, 0.2);
					height: 10px;
					bottom: -10px;
				};
			}

			app-drawer {
				--app-drawer-content-container: {
					background-color: #2F3A4F;
				};
			}

			.spacer {
				@apply --layout-center-center;
				@apply --layout-flex-auto;
				@apply --layout;
			}

			paper-tabs {
				@apply --layout-center;
				@apply --layout-horizontal;
				height: 100%;
				--paper-tabs-selection-bar-color: var(--nodecg-brand-blue);
				--paper-tabs-selection-bar: {
					border-bottom-width: 5px;
				};
			}

			paper-tab {
				@apply --layout-flex-none;
				font-size: 12px;
				text-transform: uppercase;
				user-select: none;
				--paper-tab-ink: var(--nodecg-brand-blue);
				--paper-tab-content: {
					font-weight: 500!important; /* don't bold when focused */
					color: var(--nodecg-brand-blue);
					@apply --layout-vertical;
					@apply --layout-center-center;
				};
				--paper-tab-content-unselected: {
					color: white;
				};
			}

			.workspaceTab {
				font-size: 16px;
			}

			paper-icon-button {
				--paper-icon-button-ink-color: var(--nodecg-brand-blue);
				color: white;
			}

			#mainLogo {
				height: 48px;
				width: 48px;
			}

			#drawerToolbar {
				@apply --layout-horizontal;
				@apply --layout-center;
			}

			#drawerLogo {
				height: 28px;
				padding-left: 16px;
				width: 83px;
			}

			.button-label {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			paper-icon-item {
				--paper-item-icon: {
					min-width: 56px;
				}
			}

			.list {
				margin-left: 20px;
				margin-right: 20px;
			}

			.list a {
				color: white;
				display: block;
				line-height: 40px;
				text-decoration: none;
				text-transform: uppercase;
			}

			.list a.iron-selected {
				background-color: #525F78;
			}

			.list a.iron-selected paper-icon-item {
				font-weight: bold;
			}

			ncg-dialog paper-dialog-scrollable {
				--paper-dialog-scrollable: {
					max-width: none!important;
				}
			}

			section {
				@apply --layout-flex;
				box-sizing: border-box;
			}

			section:not(.section-workspace) {
				@apply --layout-center;
				@apply --layout-vertical;
				padding: 32px;
			}

			section.section-workspace {
				height: 1px;
			}

			#pages {
				@apply --layout-flex-auto;
				@apply --layout-vertical;
				box-sizing: border-box;
				height: 1px; /* just need to specify *any* height, the rest is then taken care of somehow? */
				overflow: auto;
			}

			#reconnectToast {
				@apply --layout-center;
				@apply --layout-horizontal;
			}

			#reconnectToast paper-spinner {
				margin-left: 1em;
			}

			paper-spinner {
				--paper-spinner-layer-1-color: #645BA6;
				--paper-spinner-layer-2-color: #A50074;
				--paper-spinner-layer-3-color: #5BA664;
				--paper-spinner-layer-4-color: #C9513E;
				--paper-spinner-stroke-width: 5px;
			}

			[hidden] {
				display: none !important;
			}

			#dialogs iframe {
				box-sizing: border-box;
				margin: 0 !important;
				padding: 0 !important;
				width: 100%;
			}

			/**
			 * Phone
			 */
			@media (max-width: 640px) {
				section {
					padding: 0!important;
				}

				ncg-workspace:not([fullbleed]) {
					padding: 6px;
				}

				paper-tabs {
					display: none;
				}

				#mainLogo {
					/* makes the menu button have equal negative space on the left and the right */
					padding-left: 16px;
				}
			}
		</style>

		<app-location route="{{route}}" use-hash-as-path=""></app-location>
		<app-route route="{{route}}" pattern=":page" data="{{routeData}}" tail="{{subRoute}}"></app-route>

		<iron-media-query query="max-width: 640px" query-matches="{{smallScreen}}"></iron-media-query>

		<app-drawer-layout drawer-width="288px" force-narrow="">
			<!-- navigation drawer for small screen sizes -->
			<app-drawer id="drawer" swipe-open="[[smallScreen]]" slot="drawer">
				<template is="dom-if" if="[[smallScreen]]">
					<app-toolbar id="drawerToolbar">
						<paper-icon-button icon="close" aria-label="Close" drawer-toggle=""></paper-icon-button>
						<img id="drawerLogo" src="/dashboard/img/horiz-logo-2x.png" alt="NodeCG">
					</app-toolbar>

					<iron-selector class="list" selected="[[routeData.page]]" attr-for-selected="data-route">
						<template is="dom-repeat" items="[[workspaces]]" as="workspace" initial-count="1">
							<a data-route\$="[[workspace.route]]" href="#[[workspace.route]]" aria-label="[[workspace.name]]" on-tap="closeDrawer">
								<paper-icon-item>
									<iron-icon slot="item-icon" icon="dashboard"></iron-icon>
									<span class="button-label">[[workspace.label]]</span>
								</paper-icon-item>
							</a>
						</template>

						<template is="dom-repeat" items="[[pages]]" as="page" initial-count="1">
							<a data-route\$="[[page.route]]" href="#[[page.route]]" aria-label="[[page.name]]" on-tap="closeDrawer">
								<paper-icon-item>
									<iron-icon slot="item-icon" icon="[[page.icon]]"></iron-icon>
									[[page.name]]
								</paper-icon-item>
							</a>
						</template>
					</iron-selector>
				</template>
			</app-drawer>

			<app-header-layout fullbleed="">
				<!-- main header -->
				<app-header id="header" shadow="" slot="header">
					<app-toolbar id="mainToolbar">
						<paper-icon-button icon="menu" drawer-toggle="" alt="Toogle navigation menu" hidden="[[!smallScreen]]"></paper-icon-button>

						<img id="mainLogo" src="/dashboard/img/square-logo.png" alt="NodeCG">

						<template is="dom-if" if="[[!smallScreen]]">
							<paper-tabs class="spacer" scrollable="" selected="[[routeData.page]]" attr-for-selected="route">
								<template is="dom-repeat" items="[[workspaces]]" as="workspace">
									<paper-tab class="workspaceTab" data-route\$="[[workspace.route]]" route="[[workspace.route]]" aria-label="[[workspace.name]]" on-tap="_selectRoute">
										[[workspace.label]]
									</paper-tab>
								</template>
							</paper-tabs>

							<paper-tabs selected="[[routeData.page]]" attr-for-selected="route">
								<template is="dom-repeat" items="[[pages]]" as="page" initial-count="1">
									<paper-tab data-route\$="[[page.route]]" route="[[page.route]]" aria-label="[[page.name]]" on-tap="_selectRoute">
										<iron-icon icon="[[page.icon]]"></iron-icon>
										[[page.name]]
									</paper-tab>
								</template>

								<paper-tab hidden="[[loginDisabled]]" aria-label="Sign Out" on-tap="logout">
									<iron-icon icon="exit-to-app"></iron-icon>
									Sign Out
								</paper-tab>
							</paper-tabs>
						</template>
					</app-toolbar>
				</app-header>

				<iron-pages id="pages" selected="[[route.path]]" attr-for-selected="route">
					<template is="dom-repeat" items="[[workspaces]]" as="workspace">
						<section route="[[workspace.route]]" class="section-workspace">
							<ncg-workspace workspace="[[workspace]]" route="[[route]]"></ncg-workspace>
						</section>
					</template>

					<section route="graphics">
						<ncg-graphics></ncg-graphics>
					</section>

					<section route="mixer">
						<ncg-mixer></ncg-mixer>
					</section>

					<section route="assets">
						<ncg-assets></ncg-assets>
					</section>

					<section route="settings">
						<ncg-settings></ncg-settings>
					</section>
				</iron-pages>

			</app-header-layout>
		</app-drawer-layout>

		<div id="dialogs">
			<template is="dom-repeat" items="[[dialogs]]" as="dialog">
				<ncg-dialog id="[[dialog.bundleName]]_[[dialog.name]]" bundle="[[dialog.bundleName]]" panel="[[dialog.name]]" width="[[dialog.width]]" with-backdrop="">
					<h2 hidden="[[_falsey(dialog.title)]]">[[dialog.title]]</h2>

					<paper-dialog-scrollable>
						<iframe src="/bundles/[[dialog.bundleName]]/dashboard/[[dialog.file]]" frameborder="0" scrolling="no" id="[[dialog.bundleName]]_[[dialog.name]]_iframe">
						</iframe>
					</paper-dialog-scrollable>

					<div class="buttons" hidden="[[_falsey(dialog.dialogButtons)]]">
						<template is="dom-repeat" items="[[dialog.dialogButtons]]" as="button">
							<paper-button class\$="[[_calcButtonClass(button.type)]]" dialog-confirm\$="[[_equal(button.type, 'confirm')]]" dialog-dismiss\$="[[_equal(button.type, 'dismiss')]]">
								[[button.name]]
							</paper-button>
						</template>
					</div>
				</ncg-dialog>
			</template>
		</div>

		<paper-toast id="mainToast"></paper-toast>
		<paper-toast id="reconnectToast" text="Attempting to reconnect to NodeCG server..." duration="0">
			<paper-spinner active="[[disconnected]]"></paper-spinner>
		</paper-toast>
`;
	}

	static get is() {
		return 'ncg-dashboard';
	}

	static get properties() {
		return {
			route: {
				type: Object,
				observer: '_routeChanged'
			},
			smallScreen: {
				type: Boolean,
				observer: '_smallScreenChanged'
			},
			loginDisabled: {
				type: Boolean,
				value: !window.ncgConfig.login.enabled
			},
			bundles: {
				type: Array,
				value: window.__renderData__.bundles
			},
			workspaces: {
				type: Array,
				value: window.__renderData__.workspaces
			},
			dialogs: {
				type: Array,
				computed: '_computeDialogs(bundles)'
			},
			pages: {
				type: Array,
				value() {
					const pages = [{
						name: 'Graphics',
						route: 'graphics',
						icon: 'visibility'
					}, {
						name: 'Mixer',
						route: 'mixer',
						icon: 'av:volume-up'
					}, {
						name: 'Assets',
						route: 'assets',
						icon: 'file-upload'
					}];

					// For the time being, the "Settings" button is only relevant
					// when login security is enabled.
					if (window.ncgConfig.login.enabled) {
						pages.push({
							name: 'Settings',
							route: 'settings',
							icon: 'settings'
						});
					}

					return pages;
				}
			}
		};
	}

	ready() {
		super.ready();

		// Images are stored as data URIs so that they can be displayed even with no connection to the server
		let FAIL_URI;
		let SUCCESS_URI;
		let notified = false;

		getImageDataURI('img/notifications/standard/fail.png', (err, result) => {
			/* istanbul ignore if: hard-to-hit error */
			if (err) {
				console.error(err);
			} else {
				FAIL_URI = result.data;
			}
		});

		getImageDataURI('img/notifications/standard/success.png', (err, result) => {
			/* istanbul ignore if: hard-to-hit error */
			if (err) {
				console.error(err);
			} else {
				SUCCESS_URI = result.data;
			}
		});

		window.socket.on('error', err => {
			/* istanbul ignore next: coverage is buggy here */
			if (err.type === 'UnauthorizedError') {
				window.location.href = '/authError?code=' + err.code + '&message=' + err.message;
			} else {
				console.error('Unhandled socket error:', err);
				this.$.mainToast.show('Unhandled socket error!');
			}
		});

		window.socket.on('disconnect', () => {
			this.$.mainToast.show('Lost connection to NodeCG server!');
			notified = false;
			this.disconnected = true;
		});

		window.socket.on('reconnecting', attempts => {
			if (!this.$.reconnectToast.opened) {
				this.$.reconnectToast.open();
			}

			if (attempts >= 3 && !notified) {
				notified = true;
				notify('Disconnected', {
					body: 'The dashboard has lost connection with NodeCG.',
					icon: FAIL_URI,
					tag: 'disconnect'
				});
			}
		});

		window.socket.on('reconnect', attempts => {
			this.$.mainToast.show('Reconnected to NodeCG server!');
			this.$.reconnectToast.hide();
			this.disconnected = false;

			if (attempts >= 3) {
				notify('Reconnected', {
					body: 'Successfully reconnected on attempt #' + attempts,
					icon: SUCCESS_URI,
					tag: 'reconnect'
				});
			}
		});

		window.socket.on('reconnect_failed', () => {
			this.$.mainToast.show('Failed to reconnect to NodeCG server!');

			notify('Reconnection Failed', {
				body: 'Could not reconnect to NodeCG after the maximum number of attempts.',
				icon: FAIL_URI,
				tag: 'reconnect_failed'
			});
		});
	}

	connectedCallback() {
		super.connectedCallback();

		// If the default workspace is hidden (due to it having no panels),
		// show the next workspace by default.
		if (this.route.path === '' && window.__renderData__.workspaces[0].route !== '') {
			window.location.hash = window.__renderData__.workspaces[0].route;
		}

		if (!this.routeData) {
			this.routeData = {};
		}

		if (!this.routeData.page) {
			this.set('routeData.page', '');
		}

		this._fixTabs();
	}

	/* istanbul ignore next: can't cover since it navigates the page */
	logout() {
		window.location.href = '/logout';
	}

	closeDrawer() {
		this.$.drawer.close();
	}

	_smallScreenChanged(newVal) {
		if (!newVal) {
			this.closeDrawer();
		}
	}

	_equal(a, b) {
		return a === b;
	}

	_selectRoute(e) {
		window.location.hash = e.target.closest('paper-tab').route;
	}

	_routeChanged() {
		this._fixTabs();
		this._fixPathDebounce = Debouncer.debounce(
			this._fixPathDebounce,
			timeOut.after(100),
			this._fixPath.bind(this)
		);
	}

	_fixTabs() {
		// For some reason, our paper-tabs elements need a little help
		// to know when the route has changed and when they should deselect their tabs.
		const tabs = this.shadowRoot.querySelectorAll('paper-tabs');
		if (tabs) {
			tabs.forEach(tabSet => {
				if (tabSet.selected !== this.route.path) {
					tabSet.selected = this.route.path;
				}
			});
		}
	}

	_fixPath() {
		// If the current hash points to a route that doesn't exist, (such as
		// after a refresh which removed a workspace), default to the first workspace.
		if (!this.$.pages.selectedItem) {
			window.location.hash = window.__renderData__.workspaces[0].route;
		}
	}

	_computeDialogs(bundles) {
		const dialogs = [];
		bundles.forEach(bundle => {
			bundle.dashboard.panels.forEach(panel => {
				if (panel.dialog) {
					dialogs.push(panel);
				}
			});
		});
		return dialogs;
	}

	_falsey(value) {
		return !value;
	}

	_calcButtonClass(buttonType) {
		return buttonType === 'confirm' ? 'nodecg-accept' : 'nodecg-reject';
	}
}

function getImageDataURI(url, cb) {
	let data;
	let canvas;
	let ctx;
	const img = new Image();
	img.onload = function () {
		// Create the canvas element.
		canvas = document.createElement('canvas');
		canvas.width = img.width;
		canvas.height = img.height;
		// Get '2d' context and draw the image.
		ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0);
		// Get canvas data URL
		try {
			data = canvas.toDataURL();
			cb(null, {
				image: img,
				data
			});
		} catch (e) {
			/* istanbul ignore next: hard-to-test error */
			cb(e);
		}

		canvas.remove();
	};

	// Load image URL.
	try {
		img.src = url;
	} catch (e) {
		/* istanbul ignore next: hard-to-test error */
		cb(e);
	}
}

function notify(title, options) {
	options = options || {};

	// Let's check if the browser supports notifications
	if (!('Notification' in window)) {
		return;
	}

	// Let's check if the user is okay to get some notification.
	// Otherwise, we need to ask the user for permission.
	// Note, Chrome does not implement the permission static property.
	// So we have to check for NOT 'denied' instead of 'default'.
	if (window.Notification.permission === 'granted') {
		// If it's okay let's create a notification
		const notification = new window.Notification(title, options);
		setTimeout(() => {
			notification.close();
		}, 5000);
	} else if (window.Notification.permission !== 'denied') {
		window.Notification.requestPermission(permission => {
			// If the user is okay, let's create a notification
			if (permission === 'granted') {
				const notification = new window.Notification(title, options);
				setTimeout(n => {
					n.close();
				}, 5000, notification);
			}
		});
	}

	// At last, if the user already denied any notification, and you
	// want to be respectful there is no need to bother them any more.
}

customElements.define('ncg-dashboard', NcgDashboard);
