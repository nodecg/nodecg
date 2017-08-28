const fs = require('fs');
const remark = require('remark');
const toc = require('remark-toc');

remark()
	.use(toc, {tight: true})
	.process(fs.readFileSync('README.md'), (err, file) => {
		if (err) {
			throw err;
		}

		fs.writeFileSync('README.md', file);
	});
