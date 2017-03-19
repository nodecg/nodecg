// TODO: remove third-party debounce lib, use Polymer's built-in debounce
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
			panels: {
				type: Array,
				computed: '_computePanels(bundles)'
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

		_routeChanged(route) {
			// This is a hack to fix packery when the viewport size is changed
			// when the workspace is not visible.
			if (route.path === '') {
				this.debounce('fixPackery', this._fixPackery, 10);
			}

			this._fixTabs();
		},

		_fixPackery() {
			if (this.route.path === '') {
				this.applyPackery();
			}
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

		_computePanels(bundles) {
			const panels = [];
			bundles.forEach(bundle => {
				bundle.dashboard.panels.forEach(panel => {
					if (!panel.dialog) {
						panels.push(panel);
					}
				});
			});
			return panels;
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
			});

			window.socket.on('reconnecting', attempts => {
				this.$.mainToast.show('Attempting to reconnect to NodeCG server...');

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
		},

		attached() {
			this._fixTabs();

			this.$.loadingSpinner.active = false;
			setTimeout(() => {
				this.$.panels.style.opacity = 1;
				this.$.panels.style.transform = 'translateY(0)';
				this.$.panels.style.pointerEvents = 'auto';
			}, 750);

			/*
			 * Packery
			 */
			window.imagesLoaded(document, () => {
				// Init Packery
				this.initPackery();
				this.startObservingPanelMutations();

				// Once all the panel iFrames are loaded, this func (from the iframe-resize bower dep)
				// automagically fixes the height of all the iframes.
				window.iFrameResize({
					log: false,
					resizeFrom: 'child',
					heightCalculationMethod: 'documentElementOffset',
					resizedCallback(data) {
						data.iframe.dispatchEvent(new CustomEvent('iframe-resized'));
					}
				});

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

			// Some hacks that are part of the way that we force the scrollbar to appear *under* the app-header.
			// It's really annoying when the scrollbar comes and goes and causes the header to shift, so
			// we fix the header in place and have the main content scroll instead.
			this.querySelector('app-header-layout').$.contentContainer.style.height = '100%';
			this.querySelector('app-header-layout').$.contentContainer.style.display = 'flex';
			this.querySelector('app-header-layout').$.contentContainer.style.flexDirection = 'column';
			this.querySelector('app-header-layout').$.contentContainer.style.boxSizing = 'border-box';
		},

		startObservingPanelMutations() {
			// Packery causes attributes changes, so before applying it
			// we disconnect then reconnect our observer to avoid infinite loops
			try {
				if (this._panelMutationObserver) {
					return;
				}

				const debouncedMutationHandler = function () {
					this._panelMutationObserver.disconnect();
					this.shiftPackery();
					this.startObservingPanelMutations();
				}.bind(this).debounce(150);

				// Create a MutationObserver which will watch for changes to the DOM and re-apply masonry
				this._panelMutationObserver = new MutationObserver(debouncedMutationHandler);

				// Define what element should be observed by the observer
				// and what types of mutations trigger the callback
				this._panelMutationObserver.observe(this.$.panels, {
					subtree: true,
					attributes: true,
					childList: true,
					characterData: true,
					attributeOldValue: false,
					characterDataOldValue: false
				});
			} catch (e) {
				console.warn('MutationObserver not supported, dashboard panels may be less responsive to DOM changes');
			}
		},

		initPackery() {
			const packery = new Packery(this.$.panels, {
				itemSelector: 'ncg-dashboard-panel',
				columnWidth: 128,
				gutter: 16,
				isInitLayout: false,
				containerStyle: {position: 'relative'}
			});
			this._packery = packery;

			// Initial sort
			const sortOrder = []; // global variable for saving order, used later
			let storedSortOrder = localStorage.getItem('panelSortingOrder');
			if (storedSortOrder) {
				storedSortOrder = JSON.parse(storedSortOrder);

				// Create a hash of items
				const itemsByFullName = {};
				const allPanels = [];
				let panelName;
				let bundleName;
				let i;
				let len;
				for (i = 0, len = packery.items.length; i < len; i++) {
					const item = packery.items[i];
					panelName = item.element.getAttribute('panel');
					bundleName = item.element.getAttribute('bundle');
					const fullName = bundleName + '.' + panelName;
					allPanels[i] = fullName;
					itemsByFullName[fullName] = item;
				}

				// Merge the saved panel array with our currently loaded panels, remove dupes
				const allPanelsOrdered = arrayUnique(storedSortOrder.concat(allPanels));

				// Remove panels that no longer exist
				const removededOld = allPanelsOrdered.filter(val => {
					return allPanels.indexOf(val) !== -1;
				});

				// Overwrite packery item order
				len = removededOld.length;
				for (i = 0; i < len; i++) {
					panelName = removededOld[i];
					packery.items[i] = itemsByFullName[panelName];
				}
			}

			// Manually trigger initial layout
			packery.layout();
			this._packeryInitialized = true;

			const panelsList = this.$.panels.querySelectorAll('ncg-dashboard-panel');
			panelsList.forEach(itemElem => {
				// Make element draggable with Draggabilly
				const draggie = new Draggabilly(itemElem, {handle: '#dragHandle'});

				// Bind Draggabilly events to Packery
				packery.bindDraggabillyEvents(draggie);
			});

			// Currently, there is no built-in option to force dragged elements to gravitate to their
			// nearest neighbour in a specific direction. This will reset their locations 100ms after a drag
			// causing them to gravitate.
			packery.on('dragItemPositioned', () => {
				setTimeout(() => {
					packery.layout();
				}, 100);
			});

			packery.on('layoutComplete', orderItems);
			packery.on('dragItemPositioned', orderItems);

			function orderItems() {
				const itemElems = packery.getItemElements();

				// Reset / empty order array
				sortOrder.length = 0;

				for (let i = 0; i < itemElems.length; i++) {
					sortOrder[i] = itemElems[i].getAttribute('bundle') + '.' + itemElems[i].getAttribute('panel');
				}

				// Save ordering
				localStorage.setItem('panelSortingOrder', JSON.stringify(sortOrder));
			}
		},

		applyPackery() {
			if (this._packeryInitialized) {
				this._packery.layout();
			}
		},

		shiftPackery() {
			// Called when anything in #panels receives a click or tap event.
			// There's probably a lot of room to optimize this and not call
			// this routine for every single click,
			// but this was just the easiest way to ensure that mutations
			// caused by clicks are caught, because those mutations might
			// have changed the vertical size of the panel.
			if (this._packeryInitialized) {
				// See http://packery.metafizzy.co/methods.html#shiftlayout for more details
				this._packery.shiftLayout();
			}
		},

		logout() {
			window.location.href = '/logout';
		},

		_equal(a, b) {
			return a === b;
		}
	});

	function arrayUnique(array) {
		const a = array.concat();
		for (let i = 0; i < a.length; ++i) {
			for (let j = i + 1; j < a.length; ++j) {
				if (a[i] === a[j]) {
					a.splice(j--, 1);
				}
			}
		}
		return a;
	}
})();
