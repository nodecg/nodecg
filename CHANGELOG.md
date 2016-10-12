<a name="0.8.5"></a>
## [0.8.5](https://github.com/nodecg/nodecg/compare/v0.8.4...v0.8.5) (2016-10-12)


### Bug Fixes

* **dashboard:** fix "copy url" button sometimes wrapping to two lines and looking bad ([6047a52](https://github.com/nodecg/nodecg/commit/6047a52))
* **dashboard:** hide "Settings" menu button if there are no settings to manage in the current configuration ([4f304eb](https://github.com/nodecg/nodecg/commit/4f304eb))
* **replicants:** fix case where an unproxied object could be leaked via the `change` event after reconnecting to Socket.IO ([9e39d45](https://github.com/nodecg/nodecg/commit/9e39d45))


### Features

* **replicants:** add `result` property to operations ([5f6e86f](https://github.com/nodecg/nodecg/commit/5f6e86f))
* **replicants:** provide better error messages when a replicant fails schema validation ([daddf64](https://github.com/nodecg/nodecg/commit/daddf64))
* **sounds:** add optional `channels` param ([f33a165](https://github.com/nodecg/nodecg/commit/f33a165))



<a name="0.8.4"></a>
## [0.8.4](https://github.com/nodecg/nodecg/compare/v0.8.3...v0.8.4) (2016-09-29)


### Bug Fixes

* **dashboard:** replace usage of cn-jsurl bower lib with new URLSearchParams API ([ea39f50](https://github.com/nodecg/nodecg/commit/ea39f50))
* **docker:** remove VOLUME statement for db folder ([2b8ecfe](https://github.com/nodecg/nodecg/commit/2b8ecfe))
* **server:** catch and re-throw otherwise uncaught socket.io errors ([1fc9a18](https://github.com/nodecg/nodecg/commit/1fc9a18))
* **server:** fix debug message logging string as number ([eac7f63](https://github.com/nodecg/nodecg/commit/eac7f63))
* **server:** improve rollbar catching of socket.io errors ([e8a3443](https://github.com/nodecg/nodecg/commit/e8a3443))
* **sounds:** fix error when soundFiles is null during option generation for Mixer panel ([19226b2](https://github.com/nodecg/nodecg/commit/19226b2))
* **sounds:** fixed sounds category not showing in assets when there are no other asset categories defined. ([#220](https://github.com/nodecg/nodecg/issues/220)) ([b744fda](https://github.com/nodecg/nodecg/commit/b744fda)), closes [#208](https://github.com/nodecg/nodecg/issues/208)


### Features

* **replicants:** add optional validation of replicant values via schemas ([26715fc](https://github.com/nodecg/nodecg/commit/26715fc))



<a name="0.8.3"></a>
## [0.8.3](https://github.com/nodecg/nodecg/compare/v0.8.2...v0.8.3) (2016-06-23)


### Bug Fixes

* **docker:** use abs path for db volume ([8480a58](https://github.com/nodecg/nodecg/commit/8480a58))
* **replicants:** fixed unexpected behavior after modifying the index of an object inside an array replicant ([2127dc4](https://github.com/nodecg/nodecg/commit/2127dc4))


### Features

* **login:** add `forceHttpsReturn` config param ([d952c95](https://github.com/nodecg/nodecg/commit/d952c95))



<a name="0.8.2"></a>
## [0.8.2](https://github.com/nodecg/nodecg/compare/v0.8.1...v0.8.2) (2016-06-11)


### Bug Fixes

* pages now autodetect what URL/port to open a socket to ([7eb1a3e](https://github.com/nodecg/nodecg/commit/7eb1a3e)), closes [#125](https://github.com/nodecg/nodecg/issues/125)



<a name="0.8.1"></a>
## [0.8.1](https://github.com/nodecg/nodecg/compare/v0.8.0...v0.8.1) (2016-06-10)


### Bug Fixes

* **dashboard:** update nodecg-replicants ([c537e36](https://github.com/nodecg/nodecg/commit/c537e36))
* **replicants:** ensure that already proxied objects aren't re-proxied ([93f5539](https://github.com/nodecg/nodecg/commit/93f5539))
* **replicants:** fix case where an unproxied object could sometimes be returned ([b1dc39b](https://github.com/nodecg/nodecg/commit/b1dc39b))
* **replicants:** fix client-side assignment being processed twice ([e52b7cb](https://github.com/nodecg/nodecg/commit/e52b7cb))
* **replicants:** fix detection of changes in late-assigned objects ([053605f](https://github.com/nodecg/nodecg/commit/053605f)), closes [#181](https://github.com/nodecg/nodecg/issues/181)
* **replicants:** fix objects inserted into arrays via array insertion methods not being proxied ([4e2d941](https://github.com/nodecg/nodecg/commit/4e2d941))
* **server:** update Node.js v6 check from 'warn and continue' to 'error and exit' on lower versions ([2fdb534](https://github.com/nodecg/nodecg/commit/2fdb534))
* update nodecg-replicant to 0.5.8 ([29323b0](https://github.com/nodecg/nodecg/commit/29323b0))


### Features

* **dialogs:** improve responsiveness of dialogs ([204c8aa](https://github.com/nodecg/nodecg/commit/204c8aa))
* **dialogs:** only add h2 title if panel.title has length ([0696088](https://github.com/nodecg/nodecg/commit/0696088))



<a name="0.8.0"></a>
# [0.8.0](https://github.com/nodecg/nodecg/compare/v0.7.7...v0.8.0) (2016-05-06)


### Bug Fixes

* **api:** throw error when handler is not a function ([9804a84](https://github.com/nodecg/nodecg/commit/9804a84))
* **dashboard:** fix "Copy Url" buttons on graphics page ([3ed107f](https://github.com/nodecg/nodecg/commit/3ed107f))
* **dashboard:** fix invalid javascript on standalone panels ([fcba09b](https://github.com/nodecg/nodecg/commit/fcba09b))
* **panels:** panels are now served by filename rather than panel name ([9f3e54b](https://github.com/nodecg/nodecg/commit/9f3e54b)), closes [#144](https://github.com/nodecg/nodecg/issues/144)
* **rollbar:** check for `config.rollbar.enabled` before activating rollbar ([cffb1a3](https://github.com/nodecg/nodecg/commit/cffb1a3))
* **sounds:** throw more informative errors when attempting to use sound api methods with no soundCues ([e159749](https://github.com/nodecg/nodecg/commit/e159749))
* **tests:** fix typo in error message ([a6a0f99](https://github.com/nodecg/nodecg/commit/a6a0f99))
* **tests:** test standalone panels, ensure autodeps are enabled ([366422d](https://github.com/nodecg/nodecg/commit/366422d))


### Code Refactoring

* **replicants:** use Proxy instead of Object.observe ([#163](https://github.com/nodecg/nodecg/issues/163)) ([05ec891](https://github.com/nodecg/nodecg/commit/05ec891))


### Features

* **rollbar:** add support for automatically reporting uncaught exceptions to Rollbar ([80f0ea6](https://github.com/nodecg/nodecg/commit/80f0ea6))
* **sounds:** add sounds feature, rename uploads to assets, add categories to assets ([52a9045](https://github.com/nodecg/nodecg/commit/52a9045))


### BREAKING CHANGES

* replicants: The order of Replicant `change` event arguments has been swapped. `newVal` is now the first argument, `oldVal` is the second argument. Be sure to update all of your `change` event handlers accordingly.

	To migrate, follow the example below:

	Before:

	```
	myRep.on('change', function (oldVal, newVal) {
		// do work
	});
	```

	After:

	```
	myRep.on('change', function (newVal, oldVal) {
		// do work
	});
	```
* replicants: The third Replicant `change` event argument has been changed. Previously it was `changes`, an array of Object.observe change records. It is now `operations`, an array of operation records in NodeCG's internal format. This format is likely to continue changing as we figure out what works best. Any further changes to this format will be considered breaking.
* replicants: WeakMap and Object.observe shims have been removed. This probably won't affect anyone, as any browser that supports Proxy also supports WeakMap, but be aware of it.
* panels: the routes for panels are now `/panel/:bundleName/:panelFile` as opposed to `/panel/:bundleName/:panelName`.
* sounds: uploads are now called assets, and their manifest format has changed



<a name="0.7.7"></a>
## [0.7.7](https://github.com/nodecg/nodecg/compare/v0.7.6...v0.7.7) (2016-03-31)


### Bug Fixes

* **api:** fix API erroring on page load ([fec7793](https://github.com/nodecg/nodecg/commit/fec7793))



<a name="0.7.6"></a>
## [0.7.6](https://github.com/nodecg/nodecg/compare/v0.7.5...v0.7.6) (2016-03-31)


### Bug Fixes

* **dashboard:** fix "copy key" button on settings page ([9182534](https://github.com/nodecg/nodecg/commit/9182534))
* **dashboard:** fix panels appearing over the top of the loading spinner ([6529248](https://github.com/nodecg/nodecg/commit/6529248))
* **deps:** bump [@nodecg](https://github.com/nodecg)/bundle-manager dep, forgot to in last release ([4580bd2](https://github.com/nodecg/nodecg/commit/4580bd2))
* **login:** improve reliability of login lib ([4e37a13](https://github.com/nodecg/nodecg/commit/4e37a13))
* **tests:** remove reference to wrench ([a9ea8d9](https://github.com/nodecg/nodecg/commit/a9ea8d9))


### Features

* **all:** update socket.io to 1.4.5, improves performance. ([59d12c2](https://github.com/nodecg/nodecg/commit/59d12c2))
* **dashboard:** add loading spinner to panels ([dbc0466](https://github.com/nodecg/nodecg/commit/dbc0466))
* **dashboard:** close the drawer panel when selecting an item ([decc77f](https://github.com/nodecg/nodecg/commit/decc77f))
* **dashboard:** emit `dialog-opened` event in a dialog's `document` when it opens ([bb527eb](https://github.com/nodecg/nodecg/commit/bb527eb))
* **dashboard:** show resolution on graphics page ([8ab9335](https://github.com/nodecg/nodecg/commit/8ab9335))



<a name="0.7.5"></a>
## [0.7.5](https://github.com/nodecg/nodecg/compare/v0.7.4...v0.7.5) (2016-03-13)


### Bug Fixes

* **dashboard:** don't apply background color to disabled paper-button elements when using builtin nodecg style classes ([a34fc9d](https://github.com/nodecg/nodecg/commit/a34fc9d))


### Features

* **api:** deprecate nearestElementWithAttribute, replace usage with element.closest() ([45b272c](https://github.com/nodecg/nodecg/commit/45b272c)), closes [#141](https://github.com/nodecg/nodecg/issues/141)
* **bundles:** Add configuration values allowing to disable bundle autodeps ([4a99774](https://github.com/nodecg/nodecg/commit/4a99774))
* **caching:** disable caching ([a70b9be](https://github.com/nodecg/nodecg/commit/a70b9be))
* **npm:** only install production dependencies for bundles ([be0e74c](https://github.com/nodecg/nodecg/commit/be0e74c))



<a name="0.7.4"></a>
## [0.7.4](https://github.com/nodecg/nodecg/compare/v0.7.3...v0.7.4) (2016-03-01)


### Bug Fixes

* **api:** fix trace logging for client-side message reception ([dc71366](https://github.com/nodecg/nodecg/commit/dc71366))
* **dashboard:** assign a more unique ID to the main paper-toast element ([00f5959](https://github.com/nodecg/nodecg/commit/00f5959))
* **dashboard:** remove default opacity style of disabled paper-button elements ([d6e5baa](https://github.com/nodecg/nodecg/commit/d6e5baa))
* **uploads:** fix case where changes to the first file caused duplication ([4e7a61f](https://github.com/nodecg/nodecg/commit/4e7a61f))


### Features

* **bundleConfig:** defaults from configschema.json are now automatically applied to nodecg.bundleConfig ([a4e28fa](https://github.com/nodecg/nodecg/commit/a4e28fa))
* **uploads:** bundles can specify allowed file types via uploads.allowedTypes ([7a1a775](https://github.com/nodecg/nodecg/commit/7a1a775))
* **uploads:** debounce change events by 500ms ([91d151c](https://github.com/nodecg/nodecg/commit/91d151c))



<a name="0.7.3"></a>
## [0.7.3](https://github.com/nodecg/nodecg/compare/v0.7.2...v0.7.3) (2016-02-20)


### Bug Fixes

* **uploads:** prevent crash related to uninstalled bundles ([9d17dc3](https://github.com/nodecg/nodecg/commit/9d17dc3))


### Features

* **dashboard:** hide panel controls until mouseover ([7855a0b](https://github.com/nodecg/nodecg/commit/7855a0b))



<a name="0.7.2"></a>
## [0.7.2](https://github.com/nodecg/nodecg/compare/v0.7.1...v0.7.2) (2016-02-17)


### Bug Fixes

* **dashboard:** fix loading of builtin polymer element scripts ([52cc0fc](https://github.com/nodecg/nodecg/commit/52cc0fc))
* **dashboard:** remove unintentionally added "uploads" page ([e2eb80b](https://github.com/nodecg/nodecg/commit/e2eb80b))
* **scripts:** Remove trailing comma from package.json ([6304457](https://github.com/nodecg/nodecg/commit/6304457))
* **tests:** Have Travis install grunt before running tests ([d49091a](https://github.com/nodecg/nodecg/commit/d49091a))


### Features

* **uploads:** add file upload system ([e109edf](https://github.com/nodecg/nodecg/commit/e109edf)), closes [#104](https://github.com/nodecg/nodecg/issues/104)



<a name="0.7.1"></a>
## [0.7.1](https://github.com/nodecg/nodecg/compare/v0.7.0...v0.7.1) (2016-01-30)



<a name="0.7.0"></a>
# [0.7.0](https://github.com/nodecg/nodecg/compare/v0.6.2...v0.7.0) (2016-01-19)



<a name="0.6.2"></a>
## [0.6.2](https://github.com/nodecg/nodecg/compare/v0.6.1...v0.6.2) (2015-09-30)



<a name="0.6.1"></a>
## [0.6.1](https://github.com/nodecg/nodecg/compare/v0.6.0...v0.6.1) (2015-07-30)



<a name="0.5.1"></a>
## [0.5.1](https://github.com/nodecg/nodecg/compare/v0.5.0...v0.5.1) (2015-02-19)



<a name="0.4.8"></a>
## [0.4.8](https://github.com/nodecg/nodecg/compare/v0.4.7...v0.4.8) (2015-02-16)



<a name="0.4.6"></a>
## [0.4.6](https://github.com/nodecg/nodecg/compare/v0.4.5...v0.4.6) (2015-02-14)



<a name="0.4.3"></a>
## [0.4.3](https://github.com/nodecg/nodecg/compare/v0.4.2...v0.4.3) (2015-01-20)



<a name="0.4.2"></a>
## [0.4.2](https://github.com/nodecg/nodecg/compare/v0.4.1...v0.4.2) (2015-01-19)



<a name="0.4.1"></a>
## [0.4.1](https://github.com/nodecg/nodecg/compare/v0.4.0...v0.4.1) (2015-01-19)



<a name="0.3.0"></a>
# [0.3.0](https://github.com/nodecg/nodecg/compare/v0.2.1...v0.3.0) (2014-12-18)



<a name="0.2.1"></a>
## [0.2.1](https://github.com/nodecg/nodecg/compare/v0.2.0...v0.2.1) (2014-11-16)



<a name="0.2.0"></a>
# [0.2.0](https://github.com/nodecg/nodecg/compare/v0.1.3...v0.2.0) (2014-11-16)



<a name="0.1.3"></a>
## [0.1.3](https://github.com/nodecg/nodecg/compare/v0.1.2...v0.1.3) (2014-11-09)



<a name="0.1.2"></a>
## [0.1.2](https://github.com/nodecg/nodecg/compare/v0.1.1...v0.1.2) (2014-11-05)



<a name="0.1.1"></a>
## [0.1.1](https://github.com/nodecg/nodecg/compare/0.1.0...v0.1.1) (2014-11-05)



<a name="0.1.0"></a>
# [0.1.0](https://github.com/nodecg/nodecg/compare/0.0.1...0.1.0) (2014-11-05)



<a name="0.0.1"></a>
## 0.0.1 (2014-10-07)



