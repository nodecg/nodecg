class NcgGraphics extends Polymer.Element {
	static get is() {
		return 'ncg-graphics';
	}

	static get properties() {
		return {
			bundlesWithGraphics: {
				type: Array,
				value: window.__renderData__.bundles.filter(bundle => {
					return bundle.graphics && bundle.graphics.length > 0;
				})
			}
		};
	}

	ready() {
		const instancesList = this.$.instancesList;
		const empty = this.$['instancesList-empty'];
		const liveSocketIds = new NodeCG.Replicant('liveSocketIds', '_singleInstance');

		liveSocketIds.on('change', newVal => {
			// Remove all currently listed instances
			while (instancesList.firstChild) {
				instancesList.removeChild(instancesList.firstChild);
			}

			// Add the new instances
			if (typeof newVal === 'object') {
				for (const url in newVal) {
					if (!{}.hasOwnProperty.call(newVal, url)) {
						continue;
					}

					if (!newVal[url]) {
						return;
					}

					const siEl = document.createElement('ncg-single-instance');
					siEl.url = url;
					instancesList.appendChild(siEl);
				}
			}
		});

		// Observe #instancesList
		const observer = new MutationObserver(() => {
			if (instancesList.firstChild) {
				instancesList.style.display = 'block';
				empty.style.display = 'none';
			} else {
				instancesList.style.display = 'none';
				empty.style.display = 'flex';
			}
		});

		observer.observe(instancesList, {
			childList: true,
			subtree: true
		});
	}

	attached() {
		const buttons = this.querySelectorAll('.copyButton');
		const clipboard = new Clipboard(buttons);
		clipboard.on('success', () => {
			this.$.copyToast.show('Graphic URL copied to clipboard.');
		});
		clipboard.on('error', e => {
			this.$.copyToast.show('Failed to copy graphic URL to clipboard!');
			console.error(e);
		});
	}

	_computeFullGraphicUrl(url) {
		const a = document.createElement('a');
		a.href = url;
		let absUrl = a.href;

		if (window.ncgConfig.login.enabled && window.token) {
			absUrl += `?key=${window.token}`;
		}

		return absUrl;
	}
}

customElements.define('ncg-graphics', NcgGraphics);
