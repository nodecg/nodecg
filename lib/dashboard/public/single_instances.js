/* global NodeCG */
document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    var instancesDialog = document.getElementById('singleInstanceDialog');
    var openInstancesDialog = document.getElementById('showInstances');
    var instancesList = document.getElementById('instancesList');
    var empty = document.getElementById('instancesList-empty');

    openInstancesDialog.addEventListener('click', function() {
        instancesDialog.open();
    }, false);

    var liveSocketIds = NodeCG.Replicant('liveSocketIds', '_singleInstance');
    liveSocketIds.on('change', function(oldVal, newVal) {
        // Remove all currently listed instances
        while (instancesList.firstChild) {
            instancesList.removeChild(instancesList.firstChild);
        }

        // Add the new instances
        var instanceUrls = Object.keys(newVal);
        instanceUrls.forEach(function(url) {
            if (newVal[url] === null) return;
            var siEl = document.createElement('ncg-single-instance');
            siEl.url = url;
            instancesList.appendChild(siEl);
        });
    });

    // Observe #instancesList
    var observer = new MutationObserver(function() {
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
