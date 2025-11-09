import type { PaperDialogElement } from "@polymer/paper-dialog";

import type { NodeCGAPIClient } from "../../api/api.client";

document.addEventListener(
	"click",
	(e) => {
		const nodecg = (window as any).nodecg as NodeCGAPIClient;
		const elWithDialogAttr = (e as any)
			.composedPath()[0]
			.closest("[nodecg-dialog]");
		if (elWithDialogAttr) {
			const dialogName = elWithDialogAttr.getAttribute("nodecg-dialog");
			const dialogId = `${nodecg.bundleName}_${dialogName as string}`;
			const dialogElement = window
				.top!.document.querySelector("ncg-dashboard")!
				.shadowRoot!.getElementById(dialogId) as PaperDialogElement;
			dialogElement.open();
		}
	},
	false,
);
