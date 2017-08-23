class NcgAssetCategory extends Polymer.MutableData(Polymer.Element) {
	static get is() {
		return 'ncg-asset-category';
	}

	static get properties() {
		return {
			files: Array,
			collectionName: String,
			category: Object,
			acceptsMsg: {
				type: String,
				computed: '_computeAcceptsMsg(category.allowedTypes)'
			}
		};
	}

	static get observers() {
		return [
			'_onAllowedTypesChanged(category.allowedTypes)'
		];
	}

	ready() {
		super.ready();

		this.$.replicant.addEventListener('change', e => {
			if (Array.isArray(e.detail.newVal) && e.detail.newVal.length > 0) {
				this.$.empty.style.display = 'none';
			} else {
				this.$.empty.style.display = 'block';
			}
		});
	}

	connectedCallback() {
		super.connectedCallback();
		this.$.uploadDialog.fitInto = document.body.querySelector('ncg-dashboard').shadowRoot.getElementById('pages');
		this.$.uploadDialog.resetFit();
	}

	refitUploadDialog() {
		this.$.uploadDialog.refit();
	}

	_onAllowedTypesChanged(allowedTypes) {
		const prefixed = allowedTypes.map(type => '.' + type);
		this.$.uploader.accept = prefixed.join(',');
	}

	_computeAcceptsMsg(allowedTypes) {
		let msg = 'Accepts ';
		allowedTypes.forEach((type, index) => {
			type = type.toUpperCase();
			if (index === 0) {
				msg += type;
			} else if (index === allowedTypes.length - 1) {
				if (index === 1) {
					msg += ' and ' + type;
				} else {
					msg += ', and ' + type;
				}
			} else {
				msg += ', ' + type;
			}
		});
		return msg;
	}

	_handleDeleted(e) {
		this.$.toast.text = `Deleted ${e.target.file.base}`;
		this.$.toast.show();
	}

	_handleDeletionFailed(e) {
		this.$.toast.text = `Failed to delete ${e.target.file.base}`;
		this.$.toast.show();
	}

	openUploadDialog() {
		this.$.uploadDialog.open();
		this.refitUploadDialog();
	}

	_onUploadBefore(event) {
		// Custom upload request url for file
		const file = event.detail.file;
		file.uploadTarget = `${event.target.target}/${file.name}`;
	}

	_onFileReject(event) {
		this.refitUploadDialog();
		this.$.toast.text = `${event.detail.file.name} error: ${event.detail.error}`;
		this.$.toast.open();
	}
}

customElements.define(NcgAssetCategory.is, NcgAssetCategory);
