import { css } from "lit";

// Inject CSS custom properties into the document root so they're accessible globally
const globalStyle = document.createElement("style");
globalStyle.textContent = `
:root {
	color-scheme: dark;
	--nodecg-brand-blue: #00bebe;
	--nodecg-brand-blue-dark: #004949;
	--nodecg-accept-color: #32784A;
	--nodecg-benign-color: #525F78;
	--nodecg-configure-color: #6155BD;
	--nodecg-danger-color: #CF7E44;
	--nodecg-disabled-color: #8D8E91;
	--nodecg-execute-color: #FFC700;
	--nodecg-reject-color: #A33B3B;
	--nodecg-selected-color: #5280D9;
}
a { color: white; font-weight: 500; letter-spacing: 0.018em; text-decoration: underline; }
`;
document.head.appendChild(globalStyle);

export const nodecgTheme = css`
	:host {
		color: white;
		--nodecg-brand-blue: #00bebe;
		--nodecg-brand-blue-dark: #004949;
		--nodecg-accept-color: #32784a;
		--nodecg-benign-color: #525f78;
		--nodecg-configure-color: #6155bd;
		--nodecg-danger-color: #cf7e44;
		--nodecg-disabled-color: #8d8e91;
		--nodecg-execute-color: #ffc700;
		--nodecg-reject-color: #a33b3b;
		--nodecg-selected-color: #5280d9;
	}

	a {
		color: white;
		font-weight: 500;
		letter-spacing: 0.018em;
		text-decoration: underline;
	}

	button.nodecg-btn {
		background: var(--nodecg-background-color, transparent);
		border: none;
		border-radius: 0;
		color: var(--nodecg-foreground-color, white);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: inherit;
		font-size: 16px;
		font-weight: 300;
		padding: 8px 16px;
	}

	button.nodecg-btn:disabled {
		--nodecg-background-color: var(--nodecg-disabled-color);
		color: #54575c;
		cursor: default;
	}

	button.nodecg-accept { --nodecg-background-color: var(--nodecg-accept-color); }
	button.nodecg-benign { --nodecg-background-color: var(--nodecg-benign-color); }
	button.nodecg-configure { --nodecg-background-color: var(--nodecg-configure-color); }
	button.nodecg-danger { --nodecg-background-color: var(--nodecg-danger-color); }
	button.nodecg-execute {
		--nodecg-background-color: var(--nodecg-execute-color);
		--nodecg-foreground-color: black;
	}
	button.nodecg-reject { --nodecg-background-color: var(--nodecg-reject-color); }
	button.nodecg-selected { --nodecg-background-color: var(--nodecg-selected-color); }
`;

export {};
