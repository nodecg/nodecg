/* eslint-env browser */
/* global Draggabilly, Packery */
(function () {
	'use strict';

	var packery;
	var panelsEl;
	var isPackeryInit = false;

	window.initPackery = function () {
		panelsEl = document.getElementById('panels');
		packery = new Packery(panelsEl, {
			itemSelector: 'ncg-dashboard-panel',
			columnWidth: 128,
			gutter: 16,
			isInitLayout: false,
			containerStyle: {position: 'relative'}
		});

		// Initial sort
		var sortOrder = []; // global variable for saving order, used later
		var storedSortOrder = localStorage.getItem('panelSortingOrder');
		if (storedSortOrder) {
			storedSortOrder = JSON.parse(storedSortOrder);

			// create a hash of items
			var itemsByFullName = {};
			var allPanels = [];
			var panelName;
			var bundleName;
			var i;
			var len;
			for (i = 0, len = packery.items.length; i < len; i++) {
				var item = packery.items[i];
				panelName = item.element.getAttribute('panel');
				bundleName = item.element.getAttribute('bundle');
				var fullName = bundleName + '.' + panelName;
				allPanels[i] = fullName;
				itemsByFullName[fullName] = item;
			}

			// Merge the saved panel array with our currently loaded panels, remove dupes
			var allPanelsOrdered = arrayUnique(storedSortOrder.concat(allPanels));

			// Remove panels that no longer exist
			var removededOld = allPanelsOrdered.filter(function (val) {
				return allPanels.indexOf(val) !== -1;
			});

			// overwrite packery item order
			len = removededOld.length;
			for (i = 0; i < len; i++) {
				panelName = removededOld[i];
				packery.items[i] = itemsByFullName[panelName];
			}
		}

		// Manually trigger initial layout
		packery.layout();
		isPackeryInit = true;

		var panelsList = panelsEl.querySelectorAll('ncg-dashboard-panel');
		forEach(panelsList, function (i, itemElem) {
			// make element draggable with Draggabilly
			var draggie = new Draggabilly(itemElem, {handle: '#dragHandle'});

			// bind Draggabilly events to Packery
			packery.bindDraggabillyEvents(draggie);
		});

		// Currently, there is no built-in option to force dragged elements to gravitate to their
		// nearest neighbour in a specific direction. This will reset their locations 100ms after a drag
		// causing them to gravitate.
		packery.on('dragItemPositioned', function () {
			setTimeout(function () {
				packery.layout();
			}, 100);
		});

		function orderItems() {
			var itemElems = packery.getItemElements();

			// reset / empty order array
			sortOrder.length = 0;

			for (var i = 0; i < itemElems.length; i++) {
				sortOrder[i] = itemElems[i].getAttribute('bundle') + '.' + itemElems[i].getAttribute('panel');
			}

			// save ordering
			localStorage.setItem('panelSortingOrder', JSON.stringify(sortOrder));
		}

		packery.on('layoutComplete', orderItems);
		packery.on('dragItemPositioned', orderItems);
	};

	window.applyPackery = function () {
		if (isPackeryInit) {
			packery.layout();
		}
	};

	function arrayUnique(array) {
		var a = array.concat();
		for (var i = 0; i < a.length; ++i) {
			for (var j = i + 1; j < a.length; ++j) {
				if (a[i] === a[j]) {
					a.splice(j--, 1);
				}
			}
		}
		return a;
	}

	// Used to iterate over nodeLists
	function forEach(array, callback, scope) {
		for (var i = 0; i < array.length; i++) {
			callback.call(scope, i, array[i]); // passes back stuff we need
		}
	}
})();
