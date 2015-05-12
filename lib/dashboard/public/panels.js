/* jshint -W098 */
/* global Draggabilly */
'use strict';

var $packeryContainer;
var isPackeryInit = false;

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

function initPackery($panelsContainer) {
    var itemSelector = '.panel';

    $packeryContainer = $panelsContainer.packery({
        columnWidth: 128, //.panel-span-1 width = 128
        gutter: 16, // gutter = 8*2
        isInitLayout: false // disable initial layout
    });

    var pckry = $packeryContainer.data('packery');

    // Initial sort
    var sortOrder = []; // global variable for saving order, used later
    var storedSortOrder = localStorage.getItem('panelSortingOrder');
    if (storedSortOrder) {
        storedSortOrder = JSON.parse(storedSortOrder);

        //create a hash of items
        var itemsByPanelName = {},
            allPanels = [];
        var panelName;
        for (var i = 0, len = pckry.items.length; i < len; i++) {
            var item = pckry.items[i];
            panelName = $(item.element).attr('data-panel');
            allPanels[i] = panelName;
            itemsByPanelName[panelName] = item;
        }

        // Merge the saved panel array with our currently loaded panels, remove dupes
        var allPanelsOrdered = arrayUnique(storedSortOrder.concat(allPanels));

        // Remove panels that no longer exist
        var removededOld = allPanelsOrdered.filter(function (val) {
            return allPanels.indexOf(val) !== -1;
        });

        // overwrite packery item order
        i = 0;
        len = removededOld.length;
        for (; i < len; i++) {
            panelName = removededOld[i];
            pckry.items[i] = itemsByPanelName[panelName];
        }
    }

    // Manually trigger initial layout
    $packeryContainer.packery();
    isPackeryInit = true;

    $packeryContainer.find(itemSelector).each(function (i, itemElem) {
        // make element draggable with Draggabilly
        var draggie = new Draggabilly(itemElem, {handle: '.panel-heading'});

        // bind Draggabilly events to Packery
        $packeryContainer.packery('bindDraggabillyEvents', draggie);
    });

    // Daggabilly shtuff

    // Currently, there is no built-in option to force dragged elements to gravitate to their
    // nearest neighbour in a specific direction. This will reset their locations 100ms after a drag
    // causing them to gravitate.
    $packeryContainer.packery('on', 'dragItemPositioned', function (pckryInstance, draggedItem) {
        setTimeout(function () {
            $packeryContainer.packery();
        }, 100);
    });

    function orderItems() {
        var itemElems = pckry.getItemElements();

        // reset / empty order array
        sortOrder.length = 0;

        for (var i = 0; i < itemElems.length; i++) {
            sortOrder[i] = itemElems[i].getAttribute('data-panel');
        }

        // save ordering
        localStorage.setItem('panelSortingOrder', JSON.stringify(sortOrder));
    }

    $packeryContainer.packery('on', 'layoutComplete', orderItems);
    $packeryContainer.packery('on', 'dragItemPositioned', orderItems);
}

function applyPackery() {
    if (isPackeryInit) $packeryContainer.packery();
}
