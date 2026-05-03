import "./ncg-asset-category";
import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../../css/nodecg-theme";

interface Collection {
	name: string;
	categories: { name: string; title: string; allowedTypes: string[] }[];
}

const collectionsRep = NodeCG.Replicant<Collection[]>("collections", "_assets");

class NcgAssets extends LitElement {
	static override properties = {
		collections: { type: Array },
	};

	collections: Collection[] = [];

	static override styles = [
		nodecgTheme,
		css`
			:host {
				display: flex;
				flex-direction: column;
				max-width: 600px;
				width: 100%;
			}

			.card {
				background-color: #2f3a4f;
				width: 100%;
				margin-bottom: 12px;
				box-shadow:
					0 2px 2px 0 rgba(0, 0, 0, 0.14),
					0 1px 5px 0 rgba(0, 0, 0, 0.12),
					0 3px 1px -2px rgba(0, 0, 0, 0.2);
			}

			.card-header {
				background-color: #525f78;
				border-bottom: 5px solid var(--nodecg-brand-blue);
				color: white;
				font-size: 20px;
				font-weight: bold;
				padding: 16px;
			}

			.card-content {
				padding: 0;
				background-color: #525f78;
			}

			.assets-divider {
				border-bottom: 1px solid #2f3a4f;
				box-sizing: border-box;
			}

			.assets-divider:last-of-type {
				display: none;
			}
		`,
	];

	override firstUpdated() {
		collectionsRep.on("change", (newVal) => {
			this.collections = newVal ?? [];
		});
	}

	override render() {
		return html`
			${this.collections.map(
				(collection) => html`
					<div class="card">
						<div class="card-header">${collection.name}</div>
						<div class="card-content">
							${collection.categories.map(
								(category) => html`
									<ncg-asset-category
										collection-name=${collection.name}
										.category=${category}
									></ncg-asset-category>
									<div class="assets-divider"></div>
								`,
							)}
						</div>
					</div>
				`,
			)}
		`;
	}
}

customElements.define("ncg-assets", NcgAssets);
