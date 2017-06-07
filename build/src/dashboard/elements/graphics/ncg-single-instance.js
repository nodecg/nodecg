class NcgSingleInstance extends Polymer.Element {
	static get is() {
		return 'ncg-single-instance';
	}

	static get properties() {
		return {
			url: String
		};
	}

	kill() {
		window.socket.emit('killGraphic', this.url);
	}
}

customElements.define('ncg-single-instance', NcgSingleInstance);
