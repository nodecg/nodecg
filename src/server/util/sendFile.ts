// Native
import path from 'path';

// Packages
import express from 'express';

export default (fileLocation: string, res: express.Response, next: express.NextFunction): void => {
	return res.sendFile(fileLocation, (err: NodeJS.ErrnoException) => {
		if (err) {
			if (err.code === 'ENOENT') {
				return res.type(path.extname(fileLocation)).sendStatus(404);
			}

			/* istanbul ignore next */
			if (!res.headersSent) {
				return next(err);
			}
		}
	});
};
