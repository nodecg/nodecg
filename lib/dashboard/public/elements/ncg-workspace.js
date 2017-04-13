(function () {
	'use strict';

	Polymer({
		is: 'ncg-workspace',

		properties: {
			workspace: Object,
			panels: {
				type: Array,
				computed: '_computePanels(workspace)'
			},
			fullbleed: {
				type: Boolean,
				computed: '_computeFullbleed(workspace)',
				reflectToAttribute: true,
				value: false
			},
			usePackery: {
				type: Boolean,
				computed: '_computeUsePackery(fullbleed)'
			},
			route: {
				type: Object,
				observer: '_routeChanged'
			},
			PANEL_SORT_ORDER_STORAGE_KEY: {
				type: String,
				computed: '_computePanelSortOrderStorageKey(workspace)'
			}
		},

		listeners: {
			tap: 'shiftPackery'
		},

		_computePanels(workspace) {
			const workspaceName = workspace.route === '' ? 'default' : workspace.name;
			const bundles = window.__renderData__.bundles;
			const panels = [];
			bundles.forEach(bundle => {
				bundle.dashboard.panels.forEach(panel => {
					if (panel.dialog) {
						return;
					}

					if (panel.fullbleed) {
						if (workspaceName === `__nodecg_fullbleed__${bundle.name}_${panel.name}`) {
							return panels.push(panel);
						}

						return;
					}

					if (panel.workspace === workspaceName) {
						panels.push(panel);
					}
				});
			});
			return panels;
		},

		_computeFullbleed(workspace) {
			return workspace.fullbleed;
		},

		_computeUsePackery(fullbleed) {
			return !fullbleed;
		},

		_routeChanged(route) {
			if (this.usePackery) {
				// This is a hack to fix packery when the viewport size is changed
				// when the workspace is not visible.
				if (route.path === this.parentNode.route) {
					this.debounce('fixPackery', this._fixPackery, 10);
				}
			}
		},

		_computePanelSortOrderStorageKey(workspace) {
			return (workspace.route === '' ? 'default' : workspace.name) + '_workspace_panel_sort_order';
		},

		ready() {
			window.addEventListener('load', () => {
				this.$.loadingSpinner.active = false;
				setTimeout(() => {
					this.$.panels.style.opacity = 1;
					this.$.panels.style.transform = 'translateY(0)';
					this.$.panels.style.pointerEvents = 'auto';
				}, 750);
			});

			if (this.usePackery) {
				window.imagesLoaded(document, () => {
					// Init Packery
					this.initPackery();
					this.startObservingPanelMutations();
				});
			}
		},

		_fixPackery() {
			if (this.route.path === '') {
				this.applyPackery();
			}
		},

		startObservingPanelMutations() {
			// Packery causes attributes changes, so before applying it
			// we disconnect then reconnect our observer to avoid infinite loops
			try {
				if (this._panelMutationObserver) {
					return;
				}

				// Create a MutationObserver which will watch for changes to the DOM and re-apply masonry
				this._panelMutationObserver = new MutationObserver(() => {
					this.debounce('handleMutation', this._debouncedMutationHandler, 150);
				});

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
			let storedSortOrder = localStorage.getItem(this.PANEL_SORT_ORDER_STORAGE_KEY);
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
				localStorage.setItem(this.PANEL_SORT_ORDER_STORAGE_KEY, JSON.stringify(sortOrder));
			}
		},

		applyPackery() {
			this.debounce('applyPackery', () => {
				if (this._packeryInitialized) {
					this._packery.layout();
				}
			}, 10);
		},

		shiftPackery() {
			if (!this.usePackery) {
				return;
			}

			// Called when anything in #panels receives a click or tap event.
			// There's probably a lot of room to optimize this and not call
			// this routine for every single click,
			// but this was just the easiest way to ensure that mutations
			// caused by clicks are caught, because those mutations might
			// have changed the vertical size of the panel.

			this.debounce('shiftPackery', () => {
				if (this._packeryInitialized) {
					// See http://packery.metafizzy.co/methods.html#shiftlayout for more details
					this._packery.shiftLayout();
				}
			}, 100);
		},

		_handlePanelCollapseTransition(e) {
			// Whenever a panel finishes transitioning, shiftPackery.
			if (e.detail.value === false) {
				this.shiftPackery();
			}
		},

		_debouncedMutationHandler() {
			this._panelMutationObserver.disconnect();
			this.shiftPackery();
			this.startObservingPanelMutations();
		},

		_calcIframeScrolling(fullbleed) {
			return fullbleed ? 'yes' : 'no';
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
