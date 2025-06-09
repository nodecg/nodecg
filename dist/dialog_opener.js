"use strict";(()=>{document.addEventListener("click",o=>{let t=window.nodecg,e=o.composedPath()[0].closest("[nodecg-dialog]");if(e){let a=e.getAttribute("nodecg-dialog"),n=`${t.bundleName}_${a}`;window.top.document.querySelector("ncg-dashboard").shadowRoot.getElementById(n).open()}},!1);})();
//# sourceMappingURL=dialog_opener.js.map
