document.addEventListener(
	"click",
	(e) => {
		const nodecg = window.nodecg;

		const composedPath = e.composedPath();
		if (
			!composedPath ||
			composedPath.length === 0 ||
			composedPath[0] instanceof HTMLElement === false
		) {
			return;
		}

		const elWithDialogAttr = composedPath[0].closest("[nodecg-dialog]");

		if (!elWithDialogAttr) {
			return;
		}

		const dialogName = elWithDialogAttr.getAttribute("nodecg-dialog");
		window.top?.postMessage({
			type: "open-dialog",
			dialogId: `${nodecg.bundleName}_${dialogName}`,
		});
	},
	false,
);
