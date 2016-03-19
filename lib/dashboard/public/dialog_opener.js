/* global nodecg */
document.addEventListener('click', function (e) {
	'use strict';

	var elWithDialogAttr = e.target.closest('[nodecg-dialog]');
	if (elWithDialogAttr) {
		var dialogName = elWithDialogAttr.getAttribute('nodecg-dialog');
		var dialogIg = nodecg.bundleName + '_' + dialogName;
		var dialogElement = window.top.document.getElementById(dialogIg);
		dialogElement.open();
	}
}, false);
