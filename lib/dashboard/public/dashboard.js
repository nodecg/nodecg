window.onload = function () {
    'use strict';

    var container = $('body > div.container');
    var observer;
    var dashboardPanelSel = $('.dashboard-panels > .panel');

    container.imagesLoaded(function () {
        //Apply initial masonry
        applyMasonry(container);

        //Create a MutationObserver which will watch for changes to the DOM and re-apply masonry
        observer = new MutationObserver(function (mutations, observer) {
            applyMasonry(container);
        });

        // define what element should be observed by the observer
        // and what types of mutations trigger the callback
        observer.observe(document, {
            subtree: true,
            attributes: false, // causes an infinite loop, as masonry itself triggers the MutationObserver if this is true
            childList: true,
            characterData: true,
            attributeOldValue: false,
            characterDataOldValue: false
        });
    });

    // re-apply masonry onClick, useful for checkboxes that toggle controls
    container.click(function () {
        applyMasonry(container);
    });

    // TODO: have masonry re-apply when a textarea is resized
    function applyMasonry(selector) {
        selector.masonry({
            columnWidth: 128 + 8, //.panel-span-1 width = 128, +8 for 4px pad on each side
            itemSelector: '.dashboard-panels > .panel'
        });
    }

    // Add informational "popover" tooltips to the header of each panel
    dashboardPanelSel.find('.panel-heading').append(
        '<button type="button" class="btn btn-xs btn-info panel-info"><i class="fa fa-info"></i></button>'
    );
    dashboardPanelSel.find('.panel-info').each(function (index) {
        var pkgName = $(this).closest('.panel').attr("id");
        $(this).popover({
            title: pkgName,
            html: true,
            placement: "bottom",
            parent: $(this).closest('.panel-heading'),
            content: "<a target=\"_blank\" href=\"" + window.location.origin + "/view/" + pkgName + "\">" +
                window.location.origin + "/view/" + pkgName + "</a>"
        });
    });

    // Helper for .btn-file inputs, makes them fire the expected event and display expected filename
    $('.btn-file :file').on('change', function() {
        var input = $(this),
            numFiles = input.get(0).files ? input.get(0).files.length : 1,
            label = input.val().replace(/\\/g, '/').replace(/.*\//, ''),
            display = $(this).parents('.input-group').find('.btn-file-display');
        input.trigger('fileselect', [numFiles, label]);
        display.val(label);
    });
};
