import '../color.js';
import '../typography.js';
import '../shadow.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="material-overlay">
  <template>
    <style>
      :host {
        top: 16px;
        right: 16px;
        /* TODO (@jouni): remove unnecessary multiplication after https://github.com/vaadin/vaadin-overlay/issues/90 is fixed */
        bottom: calc(1px * var(--vaadin-overlay-viewport-bottom) + 16px);
        left: 16px;
      }

      [part="overlay"] {
        background-color: var(--material-background-color);
        border-radius: 4px;
        box-shadow: var(--material-shadow-elevation-4dp);
        color: var(--material-body-text-color);
        font-family: var(--material-font-family);
        font-size: var(--material-body-font-size);
        font-weight: 400;
      }

      [part="content"] {
        padding: 8px 0;
      }

      [part="backdrop"] {
        opacity: 0.2;
        animation: 0.2s vaadin-overlay-backdrop-enter;
        will-change: opacity;
      }

      @keyframes vaadin-overlay-backdrop-enter {
        0% {
          opacity: 0;
        }
      }
    </style>
  </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
