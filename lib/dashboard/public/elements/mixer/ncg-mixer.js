(function () {
	'use strict';

	Polymer({
		is: 'ncg-mixer',

		properties: {
			bundlesWithSounds: {
				type: Array,
				value: window.__renderData__.bundles.filter(bundle => {
					return bundle.soundCues && bundle.soundCues.length > 0;
				})
			}
		},

		ready() {
			const masterFader = this.$.masterFader;
			const masterVolume = NodeCG.Replicant('volume:master', '_sounds');

			masterFader.addEventListener('change', e => {
				masterVolume.value = e.target.value;
			});

			masterVolume.on('change', newVal => {
				masterFader.value = newVal;
			});
		}
	});
})();
