document.addEventListener("click", (e) => {
    const nodecg = window.nodecg;
    const elWithDialogAttr = e
        .composedPath()[0]
        .closest("[nodecg-dialog]");
    if (elWithDialogAttr) {
        const dialogName = elWithDialogAttr.getAttribute("nodecg-dialog");
        const dialogId = `${nodecg.bundleName}_${dialogName}`;
        const dialogElement = window
            .top.document.querySelector("ncg-dashboard")
            .shadowRoot.getElementById(dialogId);
        dialogElement.open();
    }
}, false);
export {};
//# sourceMappingURL=dialog_opener.js.map