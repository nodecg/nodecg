import '../font-icons.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="material-field-button">
  <template>
    <style>
      /* TODO(platosha): align icon sizes with other elements */
      [part\$="button"] {
        flex: none;
        width: 24px;
        height: 24px;
        padding: 4px;
        color: var(--material-secondary-text-color);
        font-size: var(--material-icon-font-size);
        line-height: 24px;
        text-align: center;
      }

      :host(:not([readonly])) [part\$="button"] {
        cursor: pointer;
      }

      :host(:not([readonly])) [part\$="button"]:hover {
        color: var(--material-text-color);
      }

      :host([disabled]) [part\$="button"],
      :host([readonly]) [part\$="button"] {
        color: var(--material-disabled-text-color);
      }

      :host([disabled]) [part="clear-button"] {
        display: none;
      }

      [part\$="button"]::before {
        font-family: "material-icons";
      }
    </style>
  </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
