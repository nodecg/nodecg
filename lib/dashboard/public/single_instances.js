/* global NodeCG */
document.addEventListener('DOMContentLoaded', () => {
	'use strict';

	const instancesList = document.getElementById('instancesList');
	const empty = document.getElementById('instancesList-empty');
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
}, false);
