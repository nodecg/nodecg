/* global Clipboard */
document.addEventListener('DOMContentLoaded', () => {
	'use strict';

	const toast = document.getElementById('mainToast');

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
			toast.text = 'Unhandled socket error!';
			toast.show();
		}
	});

	window.socket.on('disconnect', () => {
		toast.text = 'Lost connection to NodeCG server!';
		toast.show();
		notified = false;
	});

	window.socket.on('reconnecting', attempts => {
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
	});

	window.socket.on('reconnect', attempts => {
		toast.text = 'Reconnected to NodeCG server!';
		toast.show();

		if (attempts >= 3) {
			notify('Reconnected', {
				body: 'Successfully reconnected on attempt #' + attempts,
				icon: SUCCESS_URI,
				tag: 'reconnect'
			});
		}
	});

	window.socket.on('reconnect_failed', () => {
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

	// Set up graphics URL copy buttons
	Array.prototype.forEach.call(document.querySelectorAll('.js-copy[data-copy-type="graphic"]'), el => {
		const siblingA = el.previousElementSibling.firstChild;
		let absUrl = siblingA.href;

		if (window.ncgConfig.login.enabled && window.token) {
			absUrl += `?key=${window.token}`;

			// If login security is enabled, we must add the ?key to the <a> tag as well.
			siblingA.href = absUrl;
		}

		el.setAttribute('data-clipboard-text', absUrl);
	});

	/*
	 * Socket auth
	 */
	if (window.ncgConfig.login.enabled) {
		document.querySelector('#logout').addEventListener('tap', () => {
			window.location.href = '/logout';
		});
	}

	const clipboard = new Clipboard('.js-copy');
	clipboard.on('success', () => {
		toast.text = 'Text copied to clipboard.';
		toast.show();
	});

	if (window.ncgConfig.login.enabled && window.token) {
		document.querySelector('#key').textContent = window.token;
		document.querySelector('#showKey').addEventListener('tap', () => {
			document.querySelector('#showKeyDialog').open();
		});

		document.querySelector('#copyKey').setAttribute('data-clipboard-text', window.token);

		document.querySelector('#resetKey').addEventListener('tap', () => {
			window.socket.emit('regenerateToken', window.token, err => {
				if (err) {
					console.error(err);
					return;
				}

				document.location.reload();
			});
		});
	}

	const drawer = document.querySelector('paper-drawer-panel');
	drawer.querySelector('#drawer #mainContainer').addEventListener('click', e => {
		if (e.target.is === 'paper-icon-item') {
			drawer.closeDrawer();
		}
	});

	/*
	 * Mixer
	 */

	const masterFader = document.getElementById('masterFader');
	const masterVolume = NodeCG.Replicant('volume:master', '_sounds');

	masterFader.addEventListener('change', e => {
		masterVolume.value = e.target.value;
	});

	masterVolume.on('change', newVal => {
		masterFader.value = newVal;
	});
});

window.onload = function () {
	'use strict';

	const panelsEl = document.getElementById('panels');
	const spinner = document.getElementById('loadingSpinner');
	spinner.active = false;
	setTimeout(() => {
		panelsEl.style.opacity = 1;
		panelsEl.style.transform = 'translateY(0)';
		panelsEl.style.pointerEvents = 'auto';
	}, 750);

	/*
	 * Packery
	 */
	window.imagesLoaded(document, () => {
		// Init Packery
		window.initPackery();
		startObserving();

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

	let observer;

	function startObserving() {
		// Packery causes attributes changes, so before applying it
		// we disconnect then reconnect our observer to avoid infinite loops
		try {
			const debouncedMutationHandler = function () {
				observer.disconnect();
				window.applyPackery();
				startObserving();
			}.debounce(150);

			// Create a MutationObserver which will watch for changes to the DOM and re-apply masonry
			observer = new MutationObserver(debouncedMutationHandler);

			// Define what element should be observed by the observer
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

	// Re-apply packery onClick, useful for checkboxes that toggle controls
	panelsEl.addEventListener('click', () => {
		window.applyPackery();
	}, false);

	let currentRoute = '/';
	const debouncedPackeryFix = function () {
		if (currentRoute === '/') {
			window.applyPackery();
			console.log('applying packery');
		}
	}.debounce(10);

	const selector = document.querySelector('more-route-selector');
	selector.$.selection.addEventListener('selected-route-changed', e => {
		currentRoute = e.detail.value.path;
		if (currentRoute === '/') {
			debouncedPackeryFix();
		}
	});
};
