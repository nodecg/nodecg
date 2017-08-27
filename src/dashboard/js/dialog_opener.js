/* global nodecg */
document.addEventListener('click', e => {
	'use strict';

	const elWithDialogAttr = e.target.closest('[nodecg-dialog]');
	if (elWithDialogAttr) {
		const dialogName = elWithDialogAttr.getAttribute('nodecg-dialog');
		const dialogIg = nodecg.bundleName + '_' + dialogName;
		const dialogElement = window.top.document.querySelector('ncg-dashboard').shadowRoot.getElementById(dialogIg);
		dialogElement.open();
	}
}, false);
