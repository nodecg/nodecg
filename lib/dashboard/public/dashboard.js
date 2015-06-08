window.onload = function () {
    'use strict';

    /* var $panelsContainer = $('.dashboard-panels');
    var $panels = $('.dashboard-panels > .panel');
    var $socketStatus = $('#socketStatus'); */
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

    window.socket
        .on('error', function(err) {
            if (err.type === 'UnauthorizedError') {
                window.location.href = '/authError?code='+err.code+'&message='+err.message;
            } else {
                console.error('Unhandled socket error:', err);
                document.querySelector('#socket-error').show();
            }
        })

        .on('disconnect', function onDisconnect() {
            document.querySelector('#socket-disconnected').show();
            notified = false;
        })

        .on('reconnecting', function onReconnecting(attempts) {
            document.querySelector('#socket-reconnectattempt').show();
            //socketStatus('warning', '<strong>Reconnecting</strong>, attempt #' + attempts);

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
            document.querySelector('#socket-reconnected').show();
            //socketStatus('success', '<strong>Reconnected!</strong> Successfully reconnected on attempt #' + attempts);

            if (attempts >= 3) {
                notify('Reconnected', {
                    body: 'Successfully reconnected on attempt #' + attempts,
                    icon: SUCCESS_URI,
                    tag: 'reconnect'
                });
            }
        })

        .on('reconnect_failed', function onReconnectFailed() {
            document.querySelector('#socket-reconnectfailed').show();
            notify('Reconnection Failed', {
                body:'Could not reconnect to NodeCG after the maximum number of attempts.',
                icon: FAIL_URI,
                tag: 'reconnect_failed'
            });
        });

    function notify(title, options) {
        options = options || {};

        // Let's check if the browser supports notifications
        if (!('Notification' in window)) {
            alert(options.body);
            // TODO: flash window title as fallback
            // https://stackoverflow.com/questions/37122/make-browser-window-blink-in-task-bar
        }

        // Let's check if the user is okay to get some notification
        if (window.Notification.permission === 'granted') {
            // If it's okay let's create a notification
            var notification = new window.Notification(title, options);
            setTimeout(function() {
                notification.close();
            }, 5000);
        }

        // Otherwise, we need to ask the user for permission
        // Note, Chrome does not implement the permission static property
        // So we have to check for NOT 'denied' instead of 'default'
        else if (window.Notification.permission !== 'denied') {
            window.Notification.requestPermission(function (permission) {
                // If the user is okay, let's create a notification
                if (permission === 'granted') {
                    var notification = new window.Notification(title, options);
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

    var packery = new Packery(document.querySelector('#panels'), {
        itemSelector: 'nodecg-dashboard-panel',
        gutter: 10
    });

    /* global ZeroClipboard */

    if (Cookies.get('secureToken')) {
        document.querySelector('#logout').addEventListener('tap', function() {
            window.location.href = '/logout';
        });
    }

    if (window.token) {
        document.querySelector('#showKey').addEventListener('tap', function() {
            document.querySelector('#key').textContent = window.token;
            document.querySelector('#keyDialog').open();
        });

        var keyClipboard = new ZeroClipboard(document.querySelector('#copyKey'));

        document.querySelector('#resetKey').addEventListener('tap', function() {
            window.socket.emit('regenerateToken', window.token, function(err) {
                if (err) {
                    console.error(err);
                    return;
                }

                document.location.reload();
            });
        });
    }

    function buildDisplayURL() {
        var url = new Url;

        url.path = '/display';

        url.query.clear();

        url.query.width = document.querySelector('#displayWidth').value;
        url.query.height = document.querySelector('#displayHeight').value;

        if (window.token) {
            url.query.key = window.token;
        }

        var selectedViews = document.querySelectorAll('.displayView paper-checkbox[checked]');

        url.query.view = [];

        for (var i = 0; i < selectedViews.length; i++) {
            url.query.view.push(selectedViews[i].getAttribute('value'));
        }

        return url.toString();
    }

    document.querySelector('#openDisplay').addEventListener('tap', function() {
        window.open(buildDisplayURL(), '_blank', 'width=' + document.querySelector('#displayWidth').value + ',height=' + document.querySelector('#displayHeight').value);
    });

    var displayClipboard = new ZeroClipboard(document.querySelector('#copyDisplayURL'));
    displayClipboard.on('copy', function() {
        displayClipboard.setText(buildDisplayURL());
    });

    /* // Initialize all panel info popovers
    $panels.find('.panel-info').popover();

    // Helper for .btn-file inputs, makes them fire the expected event and display expected filename
    $('.btn-file :file').on('change', function() {
        var input = $(this),
            numFiles = input.get(0).files ? input.get(0).files.length : 1,
            label = input.val().replace(/\\/g, '/').replace(/.*\//, ''),
            display = $(this).parents('.input-group').find('.btn-file-display');
        input.trigger('fileselect', [numFiles, label]);
        display.val(label);
    }); */
};
