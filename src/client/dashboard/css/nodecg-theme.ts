const $documentContainer = document.createElement('template');

$documentContainer.innerHTML = `<dom-module id="nodecg-theme">
	<template>
		<style>
			:host,
			html {
				color: white;

				--nodecg-brand-blue: #00bebe;
				--nodecg-brand-blue-dark: #004949;
				--default-primary-color: var(--nodecg-brand-blue);
				--primary-color: var(--nodecg-brand-blue);

				--nodecg-accept-color: #32784A;
				--nodecg-benign-color: #525F78;
				--nodecg-configure-color: #6155BD;
				--nodecg-danger-color: #CF7E44;
				--nodecg-disabled-color: #8D8E91;
				--nodecg-execute-color: #FFC700;
				--nodecg-reject-color: #A33B3B;
				--nodecg-selected-color: #5280D9;

				--paper-toggle-button-checked-bar-color: --nodecg-brand-blue-dark;
				--paper-toggle-button-checked-button-color: var(--nodecg-brand-blue);
				--paper-toggle-button-checked-ink-color: var(--nodecg-brand-blue);
				--paper-toggle-button-label-color: white;
				--paper-toggle-button-unchecked-bar-color: #000000;
				--paper-toggle-button-unchecked-button-color: #7f7f7f;

				--paper-dialog-color: white;

				--paper-input-container-color: white;
				--paper-input-container-focus-color: white;
				--paper-input-container-input-color: white;
				--paper-slider-active-color: white;
				--paper-slider-knob-color: white;

				--paper-input-container: {
					--paper-input-container-color: var(--nodecg-brand-blue);
					--paper-input-container-focus-color: white;
					--paper-input-container-input-color: white;
				};

				--paper-input-suffix: {
					color: var(--nodecg-brand-blue);
				};

				--paper-dropdown-menu-icon: {
					color: var(--nodecg-brand-blue);
				};
			}

			vaadin-combo-box {
				--iron-icon-fill-color: var(--nodecg-brand-blue);
				--paper-input-suffix: {
					height: 24px;
					transform: translateY(-2px);
				};
			}

			vaadin-upload {
				--vaadin-upload-file-status-icon-complete: {
					color: var(--nodecg-brand-blue);
				};
				--vaadin-upload-file-name: {
					color: white;
				};
			}

			paper-button {
				background: var(--nodecg-background-color);
				border-radius: 0;
				color: var(--nodecg-foreground-color, white);
				font-size: 16px;
				font-weight: 300;
			}

			paper-button.nodecg-accept {
				--nodecg-background-color: var(--nodecg-accept-color);
			}

			paper-button.nodecg-benign {
				--nodecg-background-color: var(--nodecg-benign-color);
			}

			paper-button.nodecg-configure {
				--nodecg-background-color: var(--nodecg-configure-color);
			}

			paper-button.nodecg-danger {
				--nodecg-background-color: var(--nodecg-danger-color);
			}

			paper-button.nodecg-execute {
				--nodecg-background-color: var(--nodecg-execute-color);
				--nodecg-foreground-color: black;
			}

			paper-button.nodecg-reject {
				--nodecg-background-color: var(--nodecg-reject-color);
			}

			paper-button.nodecg-selected {
				--nodecg-background-color: var(--nodecg-selected-color);
			}

			paper-button[disabled] {
				--nodecg-background-color: var(--nodecg-disabled-color);
				color: #54575C;
			}


			paper-card {
				--paper-card-header-color: white;
				background-color: #2F3A4F;
				width: 100%;
			}

			paper-card[heading] {
				--paper-card-header: {
					background-color: #525F78;
					border-bottom: 5px solid var(--nodecg-brand-blue);
					font-weight: bold;
				};
			}

			.card-content > * {
				padding: 0 16px;
			}

			paper-dialog,
			paper-dialog-scrollable {
				background-color: #2F3A4F;
				color: white;
			}

			a {
				color: white;
				font-weight: 500;
				letter-spacing: 0.018em;
				text-decoration: underline;
			}
		</style>
	</template>
</dom-module>`;

document.head.appendChild($documentContainer.content);

// Force this file to be identified as a module so that TS can compile it.
const hack = 'hack';
export default hack;
