/**
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */
// Establish scope.
const extendedWindow = window;
extendedWindow['WebComponents'] = extendedWindow['WebComponents'] || {
    'flags': {},
};
// loading script
const file = 'webcomponents-bundle';
const script = document.querySelector('script[src*="' + file + '"]');
const flagMatcher = /wc-(.+)/;
// Note(rictic): a lot of this code looks wrong. Should we be pulling
//     the flags local variable off of window.WebComponents.flags? If not
//     then why check for noOpts, which can't possibly have been set?
// Flags. Convert url arguments to flags
const flags = {};
if (!flags['noOpts']) {
    // from url
    location.search
        .slice(1)
        .split('&')
        .forEach(function (option) {
        const parts = option.split('=');
        let match;
        if (parts[0] && (match = parts[0].match(flagMatcher))) {
            flags[match[1]] = parts[1] || true;
        }
    });
    // from script
    if (script) {
        for (let i = 0, a; (a = script.attributes[i]); i++) {
            if (a.name !== 'src') {
                flags[a.name] = a.value || true;
            }
        }
    }
    // log flags
    const log = {};
    if (flags['log'] && flags['log']['split']) {
        const parts = flags['log'].split(',');
        parts.forEach(function (f) {
            log[f] = true;
        });
    }
    flags['log'] = log;
}
// exports
extendedWindow['WebComponents']['flags'] = flags;
const forceShady = flags['shadydom'];
if (forceShady) {
    extendedWindow['ShadyDOM'] = extendedWindow['ShadyDOM'] || {};
    extendedWindow['ShadyDOM']['force'] = forceShady;
    const noPatch = flags['noPatch'];
    extendedWindow['ShadyDOM']['noPatch'] = noPatch === 'true' ? true : noPatch;
}
const forceCE = (flags['register'] || flags['ce']);
if (forceCE && window['customElements']) {
    extendedWindow['customElements']['forcePolyfill'] = forceCE;
}
export {};
//# sourceMappingURL=flag-parser.js.map