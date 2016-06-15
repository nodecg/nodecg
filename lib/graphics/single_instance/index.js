'use strict';

const fs = require('fs');
const path = require('path');
const app = require('express')();
const io = require('../../server').getIO();
const bundles = require('../../bundles');
const Replicant = require('../../replicant');
const injectScripts = require('../../util').injectScripts;
const HEARTBEAT_INTERVAL = 1000;
const heartbeatTimeouts = {};
const liveSocketIds = new Replicant('liveSocketIds', '_singleInstance', {
	defaultValue: {},
	persistent: false
});

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
	socket.on('graphicHeartbeat', (url, cb) => {
		// If the supplied url isn't for any of the urls that we're expecting, do nothing.
		if (!{}.hasOwnProperty.call(liveSocketIds.value, url)) {
			return;
		}

		/* If we have a live socket id...
		 *     and this is the live socket, reset the heartbeatTimeout and invoke callback with "true".
		 *     Else, invoke callback with "false".
		 * Else, this socket becomes the live socket. */
		if (liveSocketIds.value[url]) {
			if (socket.id === liveSocketIds.value[url]) {
				clearTimeout(heartbeatTimeouts[url]);
				heartbeatTimeouts[url] = setTimeout(() => {
					liveSocketIds.value[url] = null;
				}, HEARTBEAT_INTERVAL * 2);
				cb(true);
			} else {
				cb(false);
			}
		} else {
			liveSocketIds.value[url] = socket.id;
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
					clearTimeout(heartbeatTimeouts[url]);
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
	const fileLocation = path.resolve(__dirname, 'public/', resName);

	// Check if the file exists
	if (!fs.existsSync(fileLocation)) {
		next();
		return;
	}

	// If it's a HTML file, inject the graphic setup script and serve that
	// otherwise, send the file unmodified
	if (resName.endsWith('.html')) {
		injectScripts(fileLocation, 'graphic', {}, html => res.send(html));
	} else {
		res.sendFile(fileLocation);
	}
});

module.exports = app;

Object.defineProperty(module.exports, 'liveSocketIds', {
	get() {
		return liveSocketIds.value;
	}
});
