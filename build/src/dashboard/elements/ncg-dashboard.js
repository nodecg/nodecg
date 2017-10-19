(function () {
	'use strict';

	class NcgDashboard extends Polymer.Element {
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
					observer: '_smallSreenChanged'
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
				if (err) {
					console.error(err);
				} else {
					FAIL_URI = result.data;
				}
			});

			getImageDataURI('img/notifications/standard/success.png', (err, result) => {
				if (err) {
					console.error(err);
				} else {
					SUCCESS_URI = result.data;
				}
			});

			window.socket.on('error', err => {
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

		logout() {
			window.location.href = '/logout';
		}

		closeDrawer() {
			this.$.drawer.close();
		}

		_smallSreenChanged(newVal) {
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
			this._fixPathDebounce = Polymer.Debouncer.debounce(
				this._fixPathDebounce,
				Polymer.Async.timeOut.after(100),
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
				cb(e);
			}
			canvas.remove();
		};
		// Load image URL.
		try {
			img.src = url;
		} catch (e) {
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
})();
