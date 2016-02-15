/* eslint-env browser */
/* global NodeCG */
document.addEventListener('click', function (e) {
	'use strict';

	var parentDialogEl = window.frameElement.parentNode;

	// If the clicked item (or any of its parents) have the `dialog-dismiss` attribute, dismiss the dialog.
	var dialogDismissEl = NodeCG.nearestElementWithAttribute(e.target, 'dialog-dismiss');
	if (dialogDismissEl) {
		parentDialogEl._updateClosingReasonConfirmed(false);
		parentDialogEl.close();
		return;
	}

	// If the clicked item (or any of its parents) have the `dialog-confirm` attribute, confirm the dialog.
	var dialogConfirmEl = NodeCG.nearestElementWithAttribute(e.target, 'dialog-confirm');
	if (dialogConfirmEl) {
		parentDialogEl._updateClosingReasonConfirmed(true);
		parentDialogEl.close();
	}
}, false);
