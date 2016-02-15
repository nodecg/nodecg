/* eslint-env browser */
/* global NodeCG, nodecg */
document.addEventListener('click', function (e) {
	'use strict';

	var elWithDialogAttr = NodeCG.nearestElementWithAttribute(e.target, 'nodecg-dialog');
	if (elWithDialogAttr) {
		var dialogName = elWithDialogAttr.getAttribute('nodecg-dialog');
		var dialogIg = nodecg.bundleName + '_' + dialogName;
		var dialogElement = window.top.document.getElementById(dialogIg);
		dialogElement.open();
	}
}, false);
