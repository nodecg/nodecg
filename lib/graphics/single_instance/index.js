'use strict';

const path = require('path');
const app = require('express')();
const io = require('../../server').getIO();
const bundles = require('../../bundle-manager');
const Replicant = require('../../replicant');
const injectScripts = require('../../util').injectScripts;
const liveSocketIds = new Replicant('liveSocketIds', '_singleInstance', {
	defaultValue: {},
	persistent: false
});

const BUILD_PATH = path.join(__dirname, '../../../build/instance');

// Figure out which urls we need to enforce single instance behavior on.
bundles.all().forEach(bundle => {
	bundle.graphics.forEach(graphic => {
		if (!graphic.singleInstance) {
			return;
		}

		liveSocketIds.value[graphic.url] = null;
	});
});

io.on('connection', socket => {
	socket.on('graphic:registerSocket', (url, cb) => {
		// If the supplied url isn't for any of the urls that we're expecting, do nothing.
		if (!{}.hasOwnProperty.call(liveSocketIds.value, url)) {
			return;
		}

		/* If we have a live socket ID already, reject the request.
		 * Else, this socket becomes the live socket. */
		if (liveSocketIds.value[url]) {
			cb(false);
		} else {
			liveSocketIds.value[url] = socket.id;
			cb(true);
			app.emit('graphicOccupied', url);
		}
	});

	socket.on('isGraphicAvailable', (url, cb) => {
		cb(!liveSocketIds.value[url]);
	});

	socket.on('killGraphic', url => {
		io.emit('graphicKilled', url);
	});

	socket.on('disconnect', () => {
		// If the socket that disconnected is one of our live sockets, immediately clear it.
		for (const url in liveSocketIds.value) {
			if ({}.hasOwnProperty.call(liveSocketIds.value, url)) {
				if (socket.id === liveSocketIds.value[url]) {
					liveSocketIds.value[url] = null;
					app.emit('graphicAvailable', url);
					break;
				}
			}
		}
	});
});

app.get('/instance/*', (req, res, next) => {
	const resName = req.path.split('/').slice(2).join('/');

	// If it's a HTML file, inject the graphic setup script and serve that
	// otherwise, send the file unmodified
	if (resName.endsWith('.html')) {
		const fileLocation = path.join(BUILD_PATH, resName);
		injectScripts(fileLocation, 'graphic', {}, html => res.send(html));
	} else {
		return next();
	}
});

module.exports = app;

Object.defineProperty(module.exports, 'liveSocketIds', {
	get() {
		return liveSocketIds.value;
	}
});
