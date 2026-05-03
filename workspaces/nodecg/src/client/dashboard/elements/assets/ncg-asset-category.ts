import "./ncg-asset-file";
import "../util-scrollable";
import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../../css/nodecg-theme";
import { icon } from "../../icons";
import type { NodeCG as NCGTypes } from "../../../../types/nodecg";

class NcgAssetCategory extends LitElement {
	static override properties = {
		files: { type: Array },
		collectionName: { type: String, reflect: true },
		category: { type: Object },
		_toastText: { state: true },
		_showToast: { state: true },
	};

	files: NCGTypes.AssetFile[] = [];
	collectionName = "";
	category: { name: string; title: string; allowedTypes: string[] } = {
		name: "",
		title: "",
		allowedTypes: [],
	};
	private _toastText = "";
	private _showToast = false;
	private _assetCategoryReplicant: ReturnType<
		typeof NodeCG.Replicant<NCGTypes.AssetFile[]>
	> | null = null;
	private _assetCategoryChangeHandler: ((newVal: NCGTypes.AssetFile[] | undefined) => void) | null = null;
	private _toastTimer: ReturnType<typeof setTimeout> | null = null;

	static override styles = [
		nodecgTheme,
		css`
			:host {
				display: block;
				width: 100%;
				box-sizing: border-box;
			}

			#header {
				display: flex;
				flex-direction: column;
				background-color: #525f78;
				padding: 12px 0;
			}

			#header-main {
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: space-between;
				padding: 0 16px;
			}

			#title {
				font-size: 24px;
				font-weight: 400;
				line-height: 32px;
			}

			#add-btn {
				display: flex;
				align-items: center;
				gap: 4px;
				background: var(--nodecg-accept-color);
				border: none;
				border-radius: 0;
				color: white;
				cursor: pointer;
				font-size: 14px;
				padding: 6px 12px;
			}

			#empty {
				padding: 8px 16px;
				color: #aaa;
				font-size: 14px;
			}

			util-scrollable {
				background-color: #2f3a4f;
				max-height: 400px;
				margin: 0;
				padding: 0;
				display: flex;
				flex-direction: column;
			}

			.toast {
				position: fixed;
				bottom: 16px;
				left: 50%;
				transform: translateX(-50%);
				background: #323232;
				color: white;
				padding: 12px 24px;
				border-radius: 2px;
				z-index: 1000;
				opacity: 0;
				transition: opacity 0.3s ease;
				pointer-events: none;
			}

			.toast.visible {
				opacity: 1;
			}

			dialog {
				background: #2f3a4f;
				color: white;
				border: none;
				padding: 24px;
				max-width: 500px;
				width: 90vw;
			}

			dialog::backdrop {
				background: rgba(0, 0, 0, 0.5);
			}

			.dialog-buttons {
				display: flex;
				justify-content: flex-end;
				margin-top: 16px;
			}

			.close-btn {
				background: var(--nodecg-benign-color);
				border: none;
				border-radius: 0;
				color: white;
				cursor: pointer;
				font-size: 14px;
				padding: 8px 16px;
			}

			.upload-area {
				border: 2px dashed var(--nodecg-brand-blue);
				padding: 24px;
				text-align: center;
				margin: 16px 0;
			}

			.upload-area label {
				cursor: pointer;
				color: var(--nodecg-brand-blue);
			}

			#fileInput {
				display: none;
			}

			.accepts-msg {
				color: #aaa;
				font-size: 12px;
				margin-top: 8px;
			}

			.file-list {
				margin-top: 8px;
				font-size: 14px;
			}

			.progress-item {
				display: flex;
				align-items: center;
				gap: 8px;
				margin: 4px 0;
			}

			.progress-item progress {
				flex: 1;
				accent-color: var(--nodecg-brand-blue);
			}
		`,
	];

	override updated(changedProps: Map<string, unknown>) {
		if (changedProps.has("category") || changedProps.has("collectionName")) {
			this._computeAssetCategoryReplicant(
				this.category?.name,
				this.collectionName,
			);
		}
		if (changedProps.has("category")) {
			const input = this.shadowRoot?.querySelector<HTMLInputElement>("#fileInput");
			if (input && this.category?.allowedTypes?.length) {
				input.accept = this.category.allowedTypes.map((t) => "." + t).join(",");
			}
		}
	}

	private _computeAssetCategoryReplicant(
		categoryName: string,
		collectionName: string,
	) {
		if (!categoryName || !collectionName) return;

		if (this._assetCategoryReplicant && this._assetCategoryChangeHandler) {
			this._assetCategoryReplicant.removeListener("change", this._assetCategoryChangeHandler);
		}

		const newRep = NodeCG.Replicant<NCGTypes.AssetFile[]>(
			`assets:${categoryName}`,
			collectionName,
		);
		this._assetCategoryChangeHandler = (newVal) => {
			this.files = newVal ?? [];
		};
		newRep.on("change", this._assetCategoryChangeHandler);
		this._assetCategoryReplicant = newRep;
	}

	private _showMessage(text: string) {
		this._toastText = text;
		this._showToast = true;
		if (this._toastTimer !== null) clearTimeout(this._toastTimer);
		this._toastTimer = setTimeout(() => {
			this._showToast = false;
		}, 3000);
	}

	private _handleDeleted(e: Event) {
		const target = e.target as HTMLElement & { file: { base: string } };
		this._showMessage(`Deleted ${target.file.base}`);
	}

	private _handleDeletionFailed(e: Event) {
		const target = e.target as HTMLElement & { file: { base: string } };
		this._showMessage(`Failed to delete ${target.file.base}`);
	}

	private _openUploadDialog() {
		this.shadowRoot?.querySelector<HTMLDialogElement>("dialog")?.showModal();
	}

	private _closeUploadDialog() {
		this.shadowRoot?.querySelector<HTMLDialogElement>("dialog")?.close();
	}

	private async _onFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files) return;

		const uploads = Array.from(input.files).map((file) =>
			this._uploadFile(file),
		);
		await Promise.allSettled(uploads);
		input.value = "";
	}

	private async _uploadFile(file: File) {
		const formData = new FormData();
		formData.append("file", file);
		try {
			const response = await fetch(
				`/assets/${this.collectionName}/${this.category.name}`,
				{
					method: "POST",
					body: formData,
					credentials: "include",
				},
			);
			if (!response.ok) {
				this._showMessage(`${file.name} error: Upload failed (${response.status})`);
			}
		} catch (err) {
			this._showMessage(`${file.name} error: ${String(err)}`);
		}
	}

	private _computeAcceptsMsg(allowedTypes: string[]): string {
		if (!allowedTypes?.length) return "";
		let msg = "Accepts ";
		allowedTypes.forEach((type, index) => {
			type = type.toUpperCase();
			if (index === 0) {
				msg += type;
			} else if (index === allowedTypes.length - 1) {
				msg += (index === 1 ? " and " : ", and ") + type;
			} else {
				msg += ", " + type;
			}
		});
		return msg;
	}

	override render() {
		const hasFiles = Array.isArray(this.files) && this.files.length > 0;
		const acceptsMsg = this._computeAcceptsMsg(this.category?.allowedTypes ?? []);

		return html`
			<div class="toast ${this._showToast ? "visible" : ""}">${this._toastText}</div>

			<div id="header">
				<div id="header-main">
					<span id="title">${this.category?.title ?? ""}</span>
					<button id="add-btn" @click=${this._openUploadDialog}>
						${icon("add")} Add File(s)
					</button>
				</div>
				${!hasFiles ? html`<div id="empty">There are no assets in this category.</div>` : ""}
			</div>

			<util-scrollable>
				${this.files.map(
					(file) => html`
						<ncg-asset-file
							.file=${file}
							@deleted=${this._handleDeleted}
							@deletion-failed=${this._handleDeletionFailed}
						></ncg-asset-file>
					`,
				)}
			</util-scrollable>

			<dialog>
				<div class="upload-area">
					<input
						id="fileInput"
						type="file"
						multiple
						@change=${this._onFileSelect}
					/>
					<label for="fileInput">
						${icon("file-upload", 32)}<br />
						Drop files here or click to browse
					</label>
					${acceptsMsg ? html`<div class="accepts-msg">${acceptsMsg}</div>` : ""}
				</div>
				<div class="dialog-buttons">
					<button class="close-btn" @click=${this._closeUploadDialog}>Close</button>
				</div>
			</dialog>
		`;
	}
}

customElements.define("ncg-asset-category", NcgAssetCategory);
