document.addEventListener('click', e => {
	'use strict';

	const parentDialogEl = window.frameElement.closest('ncg-dialog');

	// If the clicked item (or any of its parents) have the `dialog-dismiss` attribute, dismiss the dialog.
	const dialogDismissEl = e.target.closest('[dialog-dismiss]');
	if (dialogDismissEl) {
		parentDialogEl._updateClosingReasonConfirmed(false);
		parentDialogEl.close();
		return;
	}

	// If the clicked item (or any of its parents) have the `dialog-confirm` attribute, confirm the dialog.
	const dialogConfirmEl = e.target.closest('[dialog-confirm]');
	if (dialogConfirmEl) {
		parentDialogEl._updateClosingReasonConfirmed(true);
		parentDialogEl.close();
	}
}, false);
