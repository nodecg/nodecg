/* global Clipboard */

document.addEventListener('WebComponentsReady', function () {
	'use strict';

	var toast = document.getElementById('mainToast');

	// Images are stored as data URIs so that they can be displayed even with no connection to the server
	var FAIL_URI;
	var SUCCESS_URI;
	var notified = false;

	getImageDataURI('img/notifications/standard/fail.png', function (err, result) {
		if (err) {
			console.error(err);
		} else {
			FAIL_URI = result.data;
		}
	});

	getImageDataURI('img/notifications/standard/success.png', function (err, result) {
		if (err) {
			console.error(err);
		} else {
			SUCCESS_URI = result.data;
		}
	});

	window.socket
		.on('error', function (err) {
			if (err.type === 'UnauthorizedError') {
				window.location.href = '/authError?code=' + err.code + '&message=' + err.message;
			} else {
				console.error('Unhandled socket error:', err);
				toast.text = 'Unhandled socket error!';
				toast.show();
			}
		})

		.on('disconnect', function onDisconnect() {
			toast.text = 'Lost connection to NodeCG server!';
			toast.show();
			notified = false;
		})

		.on('reconnecting', function onReconnecting(attempts) {
			toast.text = 'Attempting to reconnect to NodeCG server...';
			toast.show();

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
			toast.text = 'Reconnected to NodeCG server!';
			toast.show();

			if (attempts >= 3) {
				notify('Reconnected', {
					body: 'Successfully reconnected on attempt #' + attempts,
					icon: SUCCESS_URI,
					tag: 'reconnect'
				});
			}
		})

		.on('reconnect_failed', function onReconnectFailed() {
			toast.text = 'Failed to reconnect to NodeCG server!';
			toast.show();

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
			// TODO: flash window title as fallback
			// https://stackoverflow.com/questions/37122/make-browser-window-blink-in-task-bar
		}

		// Let's check if the user is okay to get some notification.
		// Otherwise, we need to ask the user for permission.
		// Note, Chrome does not implement the permission static property.
		// So we have to check for NOT 'denied' instead of 'default'.
		if (window.Notification.permission === 'granted') {
			// If it's okay let's create a notification
			var notification = new window.Notification(title, options);
			setTimeout(function () {
				notification.close();
			}, 5000);
		} else if (window.Notification.permission !== 'denied') {
			window.Notification.requestPermission(function (permission) {
				// If the user is okay, let's create a notification
				if (permission === 'granted') {
					var notification = new window.Notification(title, options);
					setTimeout(function (n) {
						n.close();
					}, 5000, notification);
				}
			});
		}

		// At last, if the user already denied any notification, and you
		// want to be respectful there is no need to bother them any more.
	}

	function getImageDataURI(url, cb) {
		var data;
		var canvas;
		var ctx;
		var img = new Image();
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
				cb(null, {image: img, data: data});
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

	// Set up graphics URL copy buttons
	Array.prototype.forEach.call(document.querySelectorAll('.js-copy[data-copy-type="graphic"]'), function (el) {
		var siblingA = el.previousElementSibling.firstChild;
		var absUrl = siblingA.href;

		if (window.ncgConfig.login.enabled && window.token) {
			absUrl += '?key=' + window.token;

			// If login security is enabled, we must add the ?key to the <a> tag as well.
			siblingA.href = absUrl;
		}

		el.setAttribute('data-clipboard-text', absUrl);
	});

	/*
	 * Socket auth
	 */
	if (window.ncgConfig.login.enabled) {
		document.querySelector('#logout').addEventListener('tap', function () {
			window.location.href = '/logout';
		});
	}

	var clipboard = new Clipboard('.js-copy');
	clipboard.on('success', function () {
		toast.text = 'Text copied to clipboard.';
		toast.show();
	});

	if (window.ncgConfig.login.enabled && window.token) {
		document.querySelector('#key').textContent = window.token;
		document.querySelector('#showKey').addEventListener('tap', function () {
			document.querySelector('#showKeyDialog').open();
		});

		document.querySelector('#copyKey').setAttribute('data-clipboard-text', window.token);

		document.querySelector('#resetKey').addEventListener('tap', function () {
			window.socket.emit('regenerateToken', window.token, function (err) {
				if (err) {
					console.error(err);
					return;
				}

				document.location.reload();
			});
		});
	}

	var drawer = document.querySelector('paper-drawer-panel');
	drawer.querySelector('#drawer #mainContainer').addEventListener('click', function (e) {
		if (e.target.is === 'paper-icon-item') {
			drawer.closeDrawer();
		}
	});

	/*
	 * Mixer
	 */

	var masterFader = document.getElementById('masterFader');
	var masterVolume = NodeCG.Replicant('volume:master', '_sounds');

	masterFader.addEventListener('change', function (e) {
		masterVolume.value = e.target.value;
	});

	masterVolume.on('change', function (newVal) {
		masterFader.value = newVal;
	});
});

window.onload = function () {
	'use strict';

	var panelsEl = document.getElementById('panels');
	var spinner = document.getElementById('loadingSpinner');
	spinner.active = false;
	setTimeout(function () {
		panelsEl.style.opacity = 1;
		panelsEl.style.transform = 'translateY(0)';
		panelsEl.style.pointerEvents = 'auto';
	}, 750);

	/*
	 * Packery
	 */
	window.imagesLoaded(document, function () {
		// Init Packery
		window.initPackery();
		startObserving();

		// Once all the panel iFrames are loaded, this func (from the iframe-resize bower dep)
		// automagically fixes the height of all the iframes.
		window.iFrameResize({
			log: false,
			resizeFrom: 'child',
			heightCalculationMethod: 'documentElementOffset',
			resizedCallback: function (data) {
				data.iframe.dispatchEvent(new CustomEvent('iframe-resized'));
			}
		});

		// Sometimes, we just need to know when a dang click event occurred. No matter where it happened.
		// This adds a `panelClick` event to all panels.
		/* eslint-disable no-loop-func */
		var panels = document.querySelectorAll('ncg-dashboard-panel iframe');
		for (var i = 0; i < panels.length; i++) {
			panels[i].contentDocument.addEventListener('click', function (e) {
				document.dispatchEvent(new CustomEvent('panelClick', e.target));
			});
		}
		/* eslint-enable no-loop-func */
	});

	var observer;

	function startObserving() {
		// Packery causes attributes changes, so before applying it
		// we disconnect then reconnect our observer to avoid infinite loops
		try {
			var onMutate = function () {
				observer.disconnect();
				window.applyPackery();
				startObserving();
			}.debounce(150);

			// Create a MutationObserver which will watch for changes to the DOM and re-apply masonry
			observer = new MutationObserver(onMutate);

			// define what element should be observed by the observer
			// and what types of mutations trigger the callback
			observer.observe(panelsEl, {
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
	}

	// re-apply packery onClick, useful for checkboxes that toggle controls
	panelsEl.addEventListener('click', function () {
		window.applyPackery();
	}, false);
};
