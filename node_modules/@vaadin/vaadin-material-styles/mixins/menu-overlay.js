import '../color.js';
import './overlay.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="material-menu-overlay">
  <template>
    <style include="material-overlay">
    </style>
  </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
