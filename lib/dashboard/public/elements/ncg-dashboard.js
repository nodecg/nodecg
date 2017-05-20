(function () {
	'use strict';

	Polymer({
		is: 'ncg-dashboard',

		properties: {
			route: {
				type: Object,
				observer: '_routeChanged'
			},
			smallScreen: {
				type: Boolean
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
		},

		_routeChanged() {
			this._fixTabs();
		},

		_fixTabs() {
			// For some reason, our paper-tabs elements need a little help
			// to know when the route has changed and when they should deselect their tabs.
			const tabs = Polymer.dom(this.root).querySelectorAll('paper-tabs');
			if (tabs) {
				tabs.forEach(tabSet => {
					if (tabSet.selected !== this.route.path) {
						tabSet.selected = this.route.path;
					}
				});
			}
		},

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
		},

		ready() {
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

			window.imagesLoaded(document, () => {
				// Once all the panel iFrames are loaded, this func (from the iframe-resize bower dep)
				// automagically fixes the height of all the iframes.
				window.iFrameResize({
					log: false,
					resizeFrom: 'child',
					heightCalculationMethod: 'documentElementOffset',
					resizedCallback(data) {
						data.iframe.dispatchEvent(new CustomEvent('iframe-resized'));
					}
				}, 'iframe:not([fullbleed]');

				// Sometimes, we just need to know when a dang click event occurred. No matter where it happened.
				// This adds a `panelClick` event to all panels.
				/* eslint-disable no-loop-func */
				const panels = document.querySelectorAll('ncg-dashboard-panel iframe');
				for (let i = 0; i < panels.length; i++) {
					panels[i].contentDocument.addEventListener('click', e => {
						document.dispatchEvent(new CustomEvent('panelClick', e.target));
					});
				}
				/* eslint-enable no-loop-func */
			});
		},

		attached() {
			if (!this.routeData) {
				this.routeData = {};
			}

			if (!this.routeData.page) {
				this.set('routeData.page', '');
			}

			this._fixTabs();

			// Some hacks that are part of the way that we force the scrollbar to appear *under* the app-header.
			// It's really annoying when the scrollbar comes and goes and causes the header to shift, so
			// we fix the header in place and have the main content scroll instead.
			this.querySelector('app-header-layout').$.contentContainer.style.height = '100%';
			this.querySelector('app-header-layout').$.contentContainer.style.display = 'flex';
			this.querySelector('app-header-layout').$.contentContainer.style.flexDirection = 'column';
			this.querySelector('app-header-layout').$.contentContainer.style.boxSizing = 'border-box';
		},

		logout() {
			window.location.href = '/logout';
		},

		closeDrawer() {
			this.$.drawer.close();
		},

		_equal(a, b) {
			return a === b;
		},

		_selectRoute(e) {
			window.location.hash = e.target.closest('paper-tab').route;
		}
	});

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
})();
