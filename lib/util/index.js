'use strict';

const path = require('path');

function sendFile(directoryToPreventTraversalOutOf, fileLocation, res, next) {
	if (isChildOf(directoryToPreventTraversalOutOf, fileLocation)) {
		res.sendFile(fileLocation, err => {
			if (err) {
				if (err.code === 'ENOENT') {
					return res.type(path.extname(fileLocation)).sendStatus(404);
				}

				/* istanbul ignore next */
				if (!res.headersSent && next) {
					next(err);
				}
			}

			return undefined;
		});
	} else {
		res.sendStatus(404);
	}
}

/**
 * Checks if a given path (dirOrFile) is a child of another given path (parent).
 */
function isChildOf(parent, dirOrFile) {
	const relative = path.relative(parent, dirOrFile);
	return (
		Boolean(relative) &&
		!relative.startsWith('..') &&
		!path.isAbsolute(relative)
	);
}

module.exports = {
	authCheck: require('./authcheck'),
	injectScripts: require('./injectscripts'),
	debounceName: require('./debounce-name'),
	sendFile,
	isChildOf
};
