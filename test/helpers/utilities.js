import {strict as assert} from 'assert';

export const sleep = milliseconds =>
	new Promise(resolve => {
		setTimeout(resolve, milliseconds);
	});

export const waitForRegistration = async page => {
	const response = await page.evaluate(() => new Promise(resolve => {
		if (window.__nodecgRegistrationAccepted__) {
			finish();
		} else {
			window.addEventListener('nodecg-registration-accepted', finish);
		}

		function finish() {
			resolve(window.__refreshMarker__);
			window.__refreshMarker__ = '__refreshMarker__';
		}
	}));
	return response && response.value;
};

export const shadowSelector = async (page, ...selectors) => {
	assert(selectors.every(selector => typeof selector === 'string'));

	return page.evaluateHandle(selectors => {
		let foundDom = document.querySelector(selectors[0]);
		for (const selector of selectors.slice(1)) {
			if (foundDom.shadowRoot) {
				foundDom = foundDom.shadowRoot.querySelector(selector);
			} else {
				foundDom = foundDom.querySelector(selector);
			}
		}
		return foundDom;
	}, selectors);
};
