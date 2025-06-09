import '@vaadin/vaadin-material-styles/color.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';

const $_documentContainer = html`<dom-module id="material-progress-bar" theme-for="vaadin-progress-bar">
  <template>
    <style>
      :host {
        height: 4px;
        margin: 8px 0;
        position: relative;
        overflow: hidden;
      }

      :host::before {
        content: "";
        display: block;
        height: 100%;
        background-color: var(--material-primary-color);
        opacity: 0.16;
      }

      [part="bar"] {
        position: absolute;
        top: 0;
        width: 100%;
        transform: scaleX(var(--vaadin-progress-value));
        transform-origin: 0 0;
      }

      [part="value"] {
        transform: none;
        background-color: var(--material-primary-color);
      }

      /* Indeterminate */

      :host([indeterminate]) [part="bar"] {
        left: -100%;
        animation: primary-indeterminate-translate 2s infinite linear;
      }

      :host([indeterminate]) [part="value"] {
        animation: primary-indeterminate-scale 2s infinite linear;
      }

      @keyframes primary-indeterminate-translate {
        0% {
          transform: translateX(0);
        }

        20% {
          animation-timing-function: cubic-bezier(.5, 0, .701732, .495819);
          transform: translateX(0);
        }

        59.15% {
          animation-timing-function: cubic-bezier(.302435, .381352, .55, .956352);
          transform: translateX(83.67142%);
        }

        100% {
          transform: translateX(200.611057%);
        }
      }

      @keyframes primary-indeterminate-scale {
        0% {
          transform: scaleX(.08);
        }

        36.65% {
          animation-timing-function: cubic-bezier(.334731, .12482, .785844, 1);
          transform: scaleX(.08);
        }

        69.15% {
          animation-timing-function: cubic-bezier(.06, .11, .6, 1);
          transform: scaleX(.661479);
        }

        100% {
          transform: scaleX(.08);
        }
      }

      /* RTL specific styles */

      :host([dir="rtl"]) [part="bar"] {
        transform-origin: 100% 0;
      }

      :host([indeterminate][dir="rtl"]) [part="bar"] {
        left: auto;
        right: -100%;
        animation: primary-indeterminate-translate-rtl 2s infinite linear;
      }

      @keyframes primary-indeterminate-translate-rtl {
        0% {
          transform: translateX(0);
        }

        20% {
          animation-timing-function: cubic-bezier(.5, 0, .701732, .495819);
          transform: translateX(0);
        }

        59.15% {
          animation-timing-function: cubic-bezier(.302435, .381352, .55, .956352);
          transform: translateX(-83.67142%);
        }

        100% {
          transform: translateX(-200.611057%);
        }
      }
    </style>
  </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
