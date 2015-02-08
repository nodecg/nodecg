window.onload = function () {
    'use strict';

    var $panelsContainer = $('.dashboard-panels');
    var $panels = $('.dashboard-panels > .panel');
    var $socketStatus = $('#socketStatus');
    var observer;

    // Images are stored as data URIs so that they can be displayed even with no connection to the server
    var FAIL_URI, SUCCESS_URI;
    var notified = false;

    getImageDataURI('img/notifications/standard/fail.png', function(err, result) {
        if (err) console.error(err);
        else FAIL_URI = result.data;
    });

    getImageDataURI('img/notifications/standard/success.png', function(err, result) {
        if (err) console.error(err);
        else SUCCESS_URI = result.data;
    });

    // socket is defined globally by an inline script in dashboard.jade
    /* global socket */
    socket
        .on('disconnect', function onDisconnect() {
            socketStatus('danger', '<strong>Disconnect!</strong> The dashboard has lost connection with NodeCG.');
            notified = false;
        })

        .on('reconnecting', function onReconnecting(attempts) {
            socketStatus('warning', '<strong>Reconnecting</strong>, attempt #' + attempts);

            if (attempts >= 3 && !notified) {
                notified = true;
                notify('Disconnected', {
                    body: 'The dashboard has lost connection with NodeCG.',
                    icon: FAIL_URI,
                    tag: 'disconnect'
                });
            }
        })

        .on('reconnect', function onReconnect(attempts) {
            socketStatus('success', '<strong>Reconnected!</strong> Successfully reconnected on attempt #' + attempts);

            if (attempts >= 3) {
                notify('Reconnected', {
                    body: 'Successfully reconnected on attempt #' + attempts,
                    icon: SUCCESS_URI,
                    tag: 'reconnect'
                });
            }
        })

        .on('reconnect_failed', function onReconnectFailed() {
            socketStatus('danger', '<strong>Failed to reconnect</strong> to NodeCG after the max. number of attempts');
            notify('Reconnection Failed', {
                body:'Could not reconnect to NodeCG after the maximum number of attempts.',
                icon: FAIL_URI,
                tag: 'reconnect_failed'
            });
        });

    function socketStatus(type, msg) {
        $socketStatus.html(
            '<div class="alert alert-dismissible alert-'+ type +'" role="alert">' +
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                    '<span aria-hidden="true">&times;</span>' +
                '</button>' +
                msg +
            '</div>'
        );
    }

    function notify(title, options) {
        options = options || {};

        // Let's check if the browser supports notifications
        /*if (!('Notification' in window)) {
            // TODO: flash window title as fallback
            // https://stackoverflow.com/questions/37122/make-browser-window-blink-in-task-bar
        }*/

        // Let's check if the user is okay to get some notification
        if (Notification.permission === 'granted') {
            // If it's okay let's create a notification
            var notification = new Notification(title, options);
            setTimeout(function() {
                notification.close();
            }, 5000);
        }

        // Otherwise, we need to ask the user for permission
        // Note, Chrome does not implement the permission static property
        // So we have to check for NOT 'denied' instead of 'default'
        else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function (permission) {
                // If the user is okay, let's create a notification
                if (permission === 'granted') {
                    var notification = new Notification(title, options);
                    setTimeout(function(n) {
                        n.close();
                    }, 5000, notification);
                }
            });
        }

        // At last, if the user already denied any notification, and you
        // want to be respectful there is no need to bother them any more.
    }

    function getImageDataURI(url, cb) {
        var data, canvas, ctx;
        var img = new Image();
        img.onload = function(){
            // Create the canvas element.
            canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            // Get '2d' context and draw the image.
            ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            // Get canvas data URL
            try{
                data = canvas.toDataURL();
                cb(null, {image:img, data:data});
            }catch(e){
                cb(e);
            }
        };
        // Load image URL.
        try{
            img.src = url;
        }catch(e){
            cb(e);
        }
    }

    $panelsContainer.imagesLoaded(function () {
        //Apply initial masonry
        applyMasonry($panelsContainer);

        try {
            //Create a MutationObserver which will watch for changes to the DOM and re-apply masonry
            observer = new MutationObserver(function () {
                applyMasonry($panelsContainer);
            });

            // define what element should be observed by the observer
            // and what types of mutations trigger the callback
            observer.observe(document, {
                subtree: true,
                attributes: false, // causes infinite loop, masonry itself triggers the MutationObserver if true
                childList: true,
                characterData: true,
                attributeOldValue: false,
                characterDataOldValue: false
            });
        } catch (e) {
            console.warn('MutationObserver not supported, dashboard panels may be less responsive to DOM changes');
        }

    });

    // re-apply masonry onClick, useful for checkboxes that toggle controls
    $panelsContainer.click(function () {
        applyMasonry($panelsContainer);
    });

    // TODO: have masonry re-apply when a textarea is resized
    function applyMasonry(selector) {
        selector.masonry({
            columnWidth: 128 + 16, //.panel-span-1 width = 128, +16 for 8px pad on each side
            itemSelector: '.dashboard-panels > .panel'
        });
    }

    // Initialize all panel info popovers
    $panels.find('.panel-info').popover();

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
