# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 1.0.0 (2024-01-02)


### ⚠ BREAKING CHANGES

* details at https://www.nodecg.dev/docs/migrating/migrating-1.x-to-2.x
* **api:** sendMessage can now trigger listenFor handlers in the same context (extension, webpage, etc).
* **login:** Twitch auth now uses the "New Twitch API", instead of the deprecated "v5" API.
* **sounds:** The undocumented customCues system has been removed.
* NodeCG no longer automatically installs the `npm` and `bower` dependencies of installed bundles. Users must do this manually.
* **replicants:** Replicants now set their state to `declared` *before* they emit their post-declare `change` event. This is unlikely to break any existing code, but it is technically a breaking change.
* This drops the Rollbar integration for error tracking.
* **api:** If the first argument you provide to a message acknowledgement is an Error, it will be serialized instead of being sent as an empty object.
* **dashboard:** Removed most of the helper styles and classes, such as `nodecg-configure`, which were being injected into panels. Most of it would not work in Polymer 2 without extra effort.

### Features

* add bundle paths customization ([#483](https://github.com/nodecg/nodecg/issues/483)) ([56ef32a](https://github.com/nodecg/nodecg/commit/56ef32a64df9e15c334e6f7a744a6536f3463175))
* add convenience 'shared' directory ([#295](https://github.com/nodecg/nodecg/issues/295)) ([63a1119](https://github.com/nodecg/nodecg/commit/63a1119684e7b266f408ea3ea2964e14571e669f))
* add mounting feature ([07210b0](https://github.com/nodecg/nodecg/commit/07210b0fc0bae8fc7cfe4877d869d88a4f59f4a2))
* add multiple bundles paths support ([#470](https://github.com/nodecg/nodecg/issues/470)) ([3b76451](https://github.com/nodecg/nodecg/commit/3b76451195d7c8d45cc117929e4b3912fd715a69))
* add Sentry integration for error tracking ([#305](https://github.com/nodecg/nodecg/issues/305)) ([92cd540](https://github.com/nodecg/nodecg/commit/92cd540108628dc050f930284c577cb298a16977))
* add support for zeit pkg builds ([#362](https://github.com/nodecg/nodecg/issues/362)) ([acb168c](https://github.com/nodecg/nodecg/commit/acb168c971631b21d87f2fe5dd12dd326c260b6b))
* **api:** add nodecg.bundleGit object ([#418](https://github.com/nodecg/nodecg/issues/418)) ([dfe0b95](https://github.com/nodecg/nodecg/commit/dfe0b95a2a4545c558dd5d8e1c4665576ccef76c))
* **api:** add nodecg.bundleVersion to api ([#459](https://github.com/nodecg/nodecg/issues/459)) ([170142b](https://github.com/nodecg/nodecg/commit/170142b92eb1d378f057cbf4676dc2efc57e89e2))
* **api:** add nodecg.unlisten method ([ea45b3f](https://github.com/nodecg/nodecg/commit/ea45b3faef4504ea57b85d4cf9e1cc049b3ee0c4))
* **api:** add NodeCG.waitForReplicants method ([b8d3ed1](https://github.com/nodecg/nodecg/commit/b8d3ed161e6f27c7556061ffa03c0f15a017892f))
* **api:** add support for intra-context messaging ([#410](https://github.com/nodecg/nodecg/issues/410)) ([3a3acf7](https://github.com/nodecg/nodecg/commit/3a3acf7dd435edc8f86a178b71d258ca5bc2be51))
* **api:** expose Logger class ([5882dc4](https://github.com/nodecg/nodecg/commit/5882dc43cfae9b19d8c3398437be6451fefcc20c))
* **api:** if an acknowledgement is called with an error as the first callback, serialize that error ([#300](https://github.com/nodecg/nodecg/issues/300)) ([1c05f81](https://github.com/nodecg/nodecg/commit/1c05f817afee8a5cfe9ce707332c633f330bafa8))
* **api:** introduce bundles replicant ([#421](https://github.com/nodecg/nodecg/issues/421)) ([94d0b1d](https://github.com/nodecg/nodecg/commit/94d0b1d791043c5453fb2a7edb7979ed13c5c327))
* **api:** make client-side sendMessage return a Promise ([#301](https://github.com/nodecg/nodecg/issues/301)) ([fe93c73](https://github.com/nodecg/nodecg/commit/fe93c738163712ee86b4c71b85235e60b16749d0))
* **auth:** add basic local authentication ([#390](https://github.com/nodecg/nodecg/issues/390)) ([54bbcf6](https://github.com/nodecg/nodecg/commit/54bbcf65992811926a697e34094d2995ddaff9d5))
* **auth:** discord login option ([#571](https://github.com/nodecg/nodecg/issues/571)) ([3df008e](https://github.com/nodecg/nodecg/commit/3df008e158bee2a9ba50627df9c1a90c86ceac3d))
* **bundle-manager:** blacklisted bundle directory names ([#357](https://github.com/nodecg/nodecg/issues/357)) ([68e7add](https://github.com/nodecg/nodecg/commit/68e7adde4baf6942747ea306edcdb3b8362d91da))
* **bundles:** avoid crash when a bundle becomes invalid after a change ([#374](https://github.com/nodecg/nodecg/issues/374)) ([4d42335](https://github.com/nodecg/nodecg/commit/4d42335947fc820895b3a888a31a1fbfbf4989f1))
* **bundles:** support loading assets from node_modules ([#358](https://github.com/nodecg/nodecg/issues/358)) ([74915d7](https://github.com/nodecg/nodecg/commit/74915d73d4444c36df64fab4652ba6f5b61643c6))
* **config:** always create cfg dir if it does not exist ([49a9255](https://github.com/nodecg/nodecg/commit/49a9255f028335562b3012548fd343e636bd46be))
* **dashboard:** Add graphic obs drag parameters ([#561](https://github.com/nodecg/nodecg/issues/561)) ([5c5a833](https://github.com/nodecg/nodecg/commit/5c5a8333aefddd9826174e2f1e8bb795c072818d))
* **dashboard:** implement dark theme ([#425](https://github.com/nodecg/nodecg/issues/425)) ([0dafe4e](https://github.com/nodecg/nodecg/commit/0dafe4eda7306bcfaffbd3534b2e1c99c89cc9a0))
* **dashboard:** implement redesigned graphics tab with refresh buttons ([#420](https://github.com/nodecg/nodecg/issues/420)) ([215f489](https://github.com/nodecg/nodecg/commit/215f48949583a7c8afe751dc84e4667a14a1abc6))
* **dashboard:** show a much shorter and easier to read URL for each graphic on the Graphics page ([5b91af1](https://github.com/nodecg/nodecg/commit/5b91af1732c98f08be8016a12373d6ea6d1f0096))
* **deps:** update chokidar to v3 ([#515](https://github.com/nodecg/nodecg/issues/515)) ([f468825](https://github.com/nodecg/nodecg/commit/f4688255eca659c72018fd72dfd2a9d2c17c4ac3))
* **docker:** build images with Node 8 ([0e4eb73](https://github.com/nodecg/nodecg/commit/0e4eb7303820392694c0bab90a859060910e74e0))
* **docker:** bump node to 10 ([#533](https://github.com/nodecg/nodecg/issues/533)) ([6fafeea](https://github.com/nodecg/nodecg/commit/6fafeeae0586f4bbaeed8cd7aedbf1eb6909337d))
* **docker:** smaller docker image ([#631](https://github.com/nodecg/nodecg/issues/631)) ([f560619](https://github.com/nodecg/nodecg/commit/f56061921f2fb188031920925c6a9818be459063))
* **extension:** add router helper ([#535](https://github.com/nodecg/nodecg/issues/535)) ([2a69423](https://github.com/nodecg/nodecg/commit/2a694236b53ce462a0e4e6f4c20b5514f09c536a))
* **extension:** allow extensions to export esmodule ([#587](https://github.com/nodecg/nodecg/issues/587)) ([8e3304a](https://github.com/nodecg/nodecg/commit/8e3304a164e74afdfb5464c870fba5c55dd663de))
* **extension:** flexible mount ([#519](https://github.com/nodecg/nodecg/issues/519)) ([3ff1603](https://github.com/nodecg/nodecg/commit/3ff160394333c611426517c945ec3a03aa643a56))
* log unhandled promise rejections if Sentry is not enabled ([59dc75e](https://github.com/nodecg/nodecg/commit/59dc75efe4febf924c058990a8a2f39f08d52ef3))
* **login:** add password hashing support for local auth ([#446](https://github.com/nodecg/nodecg/issues/446)) ([cf6192b](https://github.com/nodecg/nodecg/commit/cf6192bf8458bc74dd725e1c3115b13cbf96611f))
* **login:** add twitch id whitelisting ([#583](https://github.com/nodecg/nodecg/issues/583)) ([e83933f](https://github.com/nodecg/nodecg/commit/e83933f1515bb282bc0d98a926302b8c460ddfc7))
* **login:** expose refresh token from Twitch login authentication ([#504](https://github.com/nodecg/nodecg/issues/504)) ([b710314](https://github.com/nodecg/nodecg/commit/b710314c950e5ce8b9760a7e4563270274ee88c4))
* **package:** add "bin" prop to package.json ([0c8d0b6](https://github.com/nodecg/nodecg/commit/0c8d0b67496373fc878476813cceec364f08ca5a))
* **package:** add nsp compliance ([1b0da9b](https://github.com/nodecg/nodecg/commit/1b0da9bd49758b0eb5dae07ad06b76377bb71bbc))
* port to typescript ([#546](https://github.com/nodecg/nodecg/issues/546)) ([0060f49](https://github.com/nodecg/nodecg/commit/0060f49d2c5f1f7d91adf93f41d914eb8b81b702))
* replace Pug by Lodash with cache ([83404d1](https://github.com/nodecg/nodecg/commit/83404d18bbb27ff9ac8ecc2979191076f2db3c1b))
* **replicants:** log a warning when attempting to access .value before the Replicant has finished declaring ([#274](https://github.com/nodecg/nodecg/issues/274)) ([293acf5](https://github.com/nodecg/nodecg/commit/293acf54668254b24fc06c1d472b0c93a02889e2))
* **replicants:** remove local storage size quota ([#574](https://github.com/nodecg/nodecg/issues/574)) ([10bfd6f](https://github.com/nodecg/nodecg/commit/10bfd6ff87107fde16459140792cbc590f8497a0))
* **replicants:** update persistence process ([#497](https://github.com/nodecg/nodecg/issues/497)) ([16fcefd](https://github.com/nodecg/nodecg/commit/16fcefd75c57c92fc81ead0aa8fc95b19b6a2ee8))
* rewrite bare module specifiers ([#454](https://github.com/nodecg/nodecg/issues/454)) ([4500ccd](https://github.com/nodecg/nodecg/commit/4500ccd0103840588f06eb9c4b11964cbf2b6527))
* **security:** add support for passphrase for SSL key ([#437](https://github.com/nodecg/nodecg/issues/437)) ([c444d9b](https://github.com/nodecg/nodecg/commit/c444d9b6d52c41d500fbba91c93b6d5cc4854d24))
* **sentry:** include git information about all loaded bundles when reporting errors to sentry ([431274b](https://github.com/nodecg/nodecg/commit/431274be2d271870b5e45853f9d7f58073de6c6c))
* **typedef:** Export more types in browser.d.ts ([#465](https://github.com/nodecg/nodecg/issues/465)) ([0455036](https://github.com/nodecg/nodecg/commit/0455036d73722e759a8674d3e9037725f867b62f))
* **TypeScript:** Add NodeCG API TypeScript Type Definition ([#432](https://github.com/nodecg/nodecg/issues/432)) ([9372ca4](https://github.com/nodecg/nodecg/commit/9372ca456111385ce364a26c11b31181620381a1))


### Bug Fixes

* `iframe-resizer` content window injection ([#679](https://github.com/nodecg/nodecg/issues/679)) ([78f80ba](https://github.com/nodecg/nodecg/commit/78f80ba31305d2d982eede8cb7e1b604844a31fb))
* allow socket authentication with a token only ([#635](https://github.com/nodecg/nodecg/issues/635)) ([0241071](https://github.com/nodecg/nodecg/commit/024107127e97685bdaa4f95e7d817b42a135085a))
* always emit full user object on `login` event; only emit `login` and `logout` events for allowed users ([#666](https://github.com/nodecg/nodecg/issues/666)) ([9da8b02](https://github.com/nodecg/nodecg/commit/9da8b029a49ddd471774ad8f96ae0d201ad05b09))
* **api:** detect and throw when an object is assigned to multiple Replicants ([2fbaee3](https://github.com/nodecg/nodecg/commit/2fbaee3dd7d9874ceaae50e1f648a56f865d5885))
* **api:** don't resolve or reject the sendMessage promise if the user provided a callback instead ([fc03849](https://github.com/nodecg/nodecg/commit/fc0384900422501b8e5587ba2129fda060036048))
* **api:** don't return a Promise from sendMessage if the user provided a callback ([7dd7b00](https://github.com/nodecg/nodecg/commit/7dd7b00dfb81b39f64f3067a32f546e99bc6379f))
* **api:** fix and add tests for getDialog and getDialogDocument methods ([0ef16f6](https://github.com/nodecg/nodecg/commit/0ef16f66b43d7f4b9b8aa3faf54b1e67af75f37b))
* **api:** fix API on Safari ([a0e59e6](https://github.com/nodecg/nodecg/commit/a0e59e6f27eb21448f095de31d4945e83ca093d1))
* **api:** fix console warning when bundle has sound cues ([1c862d0](https://github.com/nodecg/nodecg/commit/1c862d0e7e4d1ebb1d227538f877015e0231efca))
* **api:** improve a few log statements ([d13a457](https://github.com/nodecg/nodecg/commit/d13a45718ba99473db8d3961e44e7c0a21f4a600))
* **assets:** filename ([#564](https://github.com/nodecg/nodecg/issues/564)) ([ddf936c](https://github.com/nodecg/nodecg/commit/ddf936cc0e169385f81e1ee4dc0f42752bb69c55))
* **assets:** fix "can't set headers..." error ([#411](https://github.com/nodecg/nodecg/issues/411)) ([518cf21](https://github.com/nodecg/nodecg/commit/518cf2124333ae54c2eab9da02b914146971ccb1))
* **assets:** improve appearance of dialogs. refactor back and frontend code to allow for potential future features. ([7025d51](https://github.com/nodecg/nodecg/commit/7025d51cebf9c2c24d3e4fb2a843187eac44e541)), closes [#309](https://github.com/nodecg/nodecg/issues/309)
* **auth:** send Client-ID header on all Twitch API requests ([#550](https://github.com/nodecg/nodecg/issues/550)) ([12d2a5e](https://github.com/nodecg/nodecg/commit/12d2a5e32b2e190b4be5780e3d9ccac13fb97ea1))
* avoid using process.env.browser to avoid real-world env conflicts ([#649](https://github.com/nodecg/nodecg/issues/649)) ([e2c80e0](https://github.com/nodecg/nodecg/commit/e2c80e03bd217854f5bca3a06dd0bdf4e7e0961f))
* better log formatting and configurable timestamps ([#575](https://github.com/nodecg/nodecg/issues/575)) ([dd323cd](https://github.com/nodecg/nodecg/commit/dd323cd72dc38343d35a374158e5e1bfde70ddfd))
* **bundle-manager:** don't attempt watch *.lock files for changes ([269f3d0](https://github.com/nodecg/nodecg/commit/269f3d087602611cf35ebbb9ab358c34cc620f21))
* **bundle-manager:** fix case where changes to a bundle's manifest could get ignored ([882f406](https://github.com/nodecg/nodecg/commit/882f406b6c0b1feb294f6b61b6654c93ca11fb13))
* **bundle-manager:** reduce frequency of crash when editing dashboard HTML files ([e20bc5a](https://github.com/nodecg/nodecg/commit/e20bc5a25b84b879a9e130e2979872a6c4b191d5))
* **bundle-manager:** remove debug print ([91546e2](https://github.com/nodecg/nodecg/commit/91546e2b56988df3d21d28ea685d103c6d2d6ee1))
* **bundle-manager:** wait 100ms before deciding that a bundle's package.json has been deleted ([abb1722](https://github.com/nodecg/nodecg/commit/abb17229fa479f1350d930ddbb033a9efe58c529))
* **bundle-parser:** check version when parsing ([#510](https://github.com/nodecg/nodecg/issues/510)) ([484d839](https://github.com/nodecg/nodecg/commit/484d8399a8567fbd14556c69c04244306494c342))
* **bundles:** avoid throwing exception on Unicode BOM ([#401](https://github.com/nodecg/nodecg/issues/401)) ([84a4555](https://github.com/nodecg/nodecg/commit/84a4555b57b0fd84dfd531515d5f4a045296a474))
* **config loader:** handle when cfg is symlink ([#670](https://github.com/nodecg/nodecg/issues/670)) ([50f0c11](https://github.com/nodecg/nodecg/commit/50f0c11b4672fe2103cd0e5b343e7559dbf08c68))
* **config:** properly load baseURL param ([8c3d76b](https://github.com/nodecg/nodecg/commit/8c3d76b06e7e36d345caa4c55c20d289e37ebff6))
* **config:** reduce the number of cases where a bundle's config is rejected when it shouldn't be ([e62de24](https://github.com/nodecg/nodecg/commit/e62de24ada74f002c949c34c0094b389e00517d5))
* correct full update read code ([#652](https://github.com/nodecg/nodecg/issues/652)) ([490d033](https://github.com/nodecg/nodecg/commit/490d033b0e7040535bac9c07d569194555c59b08))
* **dashboard:** add `raised` attribute to KILL button on single-instance graphics ([1e116db](https://github.com/nodecg/nodecg/commit/1e116dbe1365f417e69ddb5cf858b2d487f04b07))
* **dashboard:** also target root html for theme import ([0948f5f](https://github.com/nodecg/nodecg/commit/0948f5f5015504ce14467f78fd173d666acf0531))
* **dashboard:** always send 'dialog-dismissed' when clicking outside the dialog ([#385](https://github.com/nodecg/nodecg/issues/385)) ([da30fe1](https://github.com/nodecg/nodecg/commit/da30fe14c7d58b45f125b2c9fc879576530c547f))
* **dashboard:** close drawer when viewport increases to a wide layout ([20bafef](https://github.com/nodecg/nodecg/commit/20bafef6cca38c159f071de3b6284ab2504c8fca))
* **dashboard:** correct URL for obs drag when login is enabled ([#585](https://github.com/nodecg/nodecg/issues/585)) ([9046287](https://github.com/nodecg/nodecg/commit/904628737efdd0c239119757c0b55efe4cf4a761))
* **dashboard:** enforce that the /dashboard/ route end in a trailing slash ([301d837](https://github.com/nodecg/nodecg/commit/301d8370b37907595acc2df90b34896cc9f5ecce))
* **dashboard:** ensure the default workspace is first ([#458](https://github.com/nodecg/nodecg/issues/458)) ([18fdbe6](https://github.com/nodecg/nodecg/commit/18fdbe6e71b73cefde2c3422564acd9fecfe1fa4))
* **dashboard:** fix `nodecg-dialog` helper ([55ab7e9](https://github.com/nodecg/nodecg/commit/55ab7e95d062b02a54b7ee02f35ae6d8715dd6cf))
* **dashboard:** fix an extra vertical scrollbar appearing when a fullbleed panel has vertical scrolling ([71fe3b8](https://github.com/nodecg/nodecg/commit/71fe3b868c69036126ff3f08334198a599b5cada))
* **dashboard:** fix graphic instances not appearing when using a bundle that is not a git repo ([54cfcd6](https://github.com/nodecg/nodecg/commit/54cfcd6e6383222a0b2b116fc10eb4f787889f56))
* **dashboard:** fix issues with Clipboard.js on Firefox ([161c3a4](https://github.com/nodecg/nodecg/commit/161c3a47a68c403155b3dd0811c75e6c68bc90aa))
* **dashboard:** fix missing background color on graphics collapse toggle button ([9e6bc4d](https://github.com/nodecg/nodecg/commit/9e6bc4d9c717b792fa9abaf73fc11b9084096a98))
* **dashboard:** fix packery not being applied correctly on initial load ([c2e5118](https://github.com/nodecg/nodecg/commit/c2e511868a23c35ba399a346099c4bd53bbaa2c9))
* **dashboard:** fix packery not getting fixed up when it should ([4e7c993](https://github.com/nodecg/nodecg/commit/4e7c9935c6749a6be26110a95dd60a8d681044da)), closes [#324](https://github.com/nodecg/nodecg/issues/324)
* **dashboard:** fix panel iframe heights in Firefox ([f71d388](https://github.com/nodecg/nodecg/commit/f71d388b1b2f4f5e19180eaa4e4b9a70ea942e8e))
* **dashboard:** fix panels not always being sized correctly on page load ([3a98751](https://github.com/nodecg/nodecg/commit/3a987512980956895e6d45de62b5b97d39b83da6))
* **dashboard:** fix Sign Out button being visible when login security is disabled ([aa12c54](https://github.com/nodecg/nodecg/commit/aa12c5494de57051fc9219c41751757fd03c8889))
* **dashboard:** fix text and icon colors of Asset upload dialog ([d1d3a45](https://github.com/nodecg/nodecg/commit/d1d3a45464e43b2f4bde4e2196aa481ce82c3d9d))
* **dashboard:** fix the currently selected workspace not being highlighted on first page load ([#538](https://github.com/nodecg/nodecg/issues/538)) ([3442d76](https://github.com/nodecg/nodecg/commit/3442d760585ee23f5fec568b6a194b734dac5be5))
* **dashboard:** fix workspaces never initializing on Firefox ([e0ba151](https://github.com/nodecg/nodecg/commit/e0ba15132ccb854e49ff0ba22b4448a5fd2dd4da)), closes [#328](https://github.com/nodecg/nodecg/issues/328)
* **dashboard:** implement missing dark theme for bundle dialogs ([d14158f](https://github.com/nodecg/nodecg/commit/d14158f707ee4f7dded217f2ed4e927ae5a3dea9))
* **dashboard:** inject default styles before user styles ([#464](https://github.com/nodecg/nodecg/issues/464)) ([5981d9e](https://github.com/nodecg/nodecg/commit/5981d9ec20fa41765e2e3c31b16e5ffcc0f22bf8))
* **dashboard:** remove extra margins that could appear in bundle dialogs ([7bb2f9f](https://github.com/nodecg/nodecg/commit/7bb2f9fd5d81d4a1bb1c3572206eaaca87e0d2e3))
* **dashboard:** remove useless and busted-looking "info" dialog from panels ([22499bd](https://github.com/nodecg/nodecg/commit/22499bd45b226e255678c44c41c5437074b5ace0))
* **dashboard:** Sort all dashboard workspaces alphabetically ([#450](https://github.com/nodecg/nodecg/issues/450)) ([786f23f](https://github.com/nodecg/nodecg/commit/786f23f138b4b2f3ab20c4e9150a336657530c66))
* **dashboard:** support the nodecg-dialog attribute within shadow roots ([#384](https://github.com/nodecg/nodecg/issues/384)) ([fc62adf](https://github.com/nodecg/nodecg/commit/fc62adfef56fbdbfefed838b7f4063245a7f00f8))
* **deps:** fix some vulnerabilities of dependency ([81c9ee2](https://github.com/nodecg/nodecg/commit/81c9ee2edb296e5bef5b8d5df7e0c9ddc9279d5b))
* **deps:** switch json-schema-lib repo ([7b7c7c1](https://github.com/nodecg/nodecg/commit/7b7c7c1f57f8513ec7b0fb310a1dfc7e1ec93465))
* **deps:** update dependencies through npm audit ([a871f4b](https://github.com/nodecg/nodecg/commit/a871f4b0cdc0969fb92f4f2b90e648015d1c1d16))
* **deps:** update express-bare-module-specifiers ([bd1d925](https://github.com/nodecg/nodecg/commit/bd1d92537da1ee1864590ea985811da3ffcb8d67))
* **dockerfile:** CMD to absolute path ([#645](https://github.com/nodecg/nodecg/issues/645)) ([eeebf0e](https://github.com/nodecg/nodecg/commit/eeebf0e13cac9f665acb293c3a41e89cdac3f666))
* **docker:** fix failing Dockerfile ([#617](https://github.com/nodecg/nodecg/issues/617)) ([1e243da](https://github.com/nodecg/nodecg/commit/1e243dac2a9d9f107cdcd57959851f62a8c05b50))
* don't list package-lock in files ([#620](https://github.com/nodecg/nodecg/issues/620)) ([e2ed466](https://github.com/nodecg/nodecg/commit/e2ed4668402c308ffddf1a2aebc93565e3d537fd))
* **extensions:** improve logging when an extension fails to mount ([e7f2a90](https://github.com/nodecg/nodecg/commit/e7f2a90e0d7d2fbde6d43b80e7cbf03bb0754cce))
* fix error when running NodeCG after installation as a dependency via npm ([#647](https://github.com/nodecg/nodecg/issues/647)) ([3aaaae8](https://github.com/nodecg/nodecg/commit/3aaaae8d71bfecb3966e34e304aaac003e3e063c))
* include templates in server build outputs ([#625](https://github.com/nodecg/nodecg/issues/625)) ([cdd8bf2](https://github.com/nodecg/nodecg/commit/cdd8bf2cf7c7b0821212d99d777b9d45e2d27e6a))
* **injectscripts:** don't inject client_registration into busy.html or killed.html ([0a63202](https://github.com/nodecg/nodecg/commit/0a632026aacf25db9784451e2e83eac79efd744e))
* **instance-errors:** Update help text & design ([#494](https://github.com/nodecg/nodecg/issues/494)) ([7fcf6ee](https://github.com/nodecg/nodecg/commit/7fcf6ee0c73fbb1eaba9b5090cf6289742397288))
* **logger:** improve formatting of errors reported to Sentry via the .error method ([cb6426e](https://github.com/nodecg/nodecg/commit/cb6426e37ed06b42f25fc9a8e9fcd526b06625e1))
* **login:** fix `key=xxx` URLs not working ([#629](https://github.com/nodecg/nodecg/issues/629)) ([6c21ff0](https://github.com/nodecg/nodecg/commit/6c21ff00df9fe5725396275d0d5738244b13d3eb))
* **login:** Redirect to /login after destroying session ([#355](https://github.com/nodecg/nodecg/issues/355)) ([30aa4ba](https://github.com/nodecg/nodecg/commit/30aa4ba6eae7e11b6ae33435d3e3702e2e12ea8c))
* **login:** use the New Twitch API ([#413](https://github.com/nodecg/nodecg/issues/413)) ([6696231](https://github.com/nodecg/nodecg/commit/6696231e18cb01fc813105e4869568cdf64f05a5))
* make node-fetch-commonjs a prod dep ([#623](https://github.com/nodecg/nodecg/issues/623)) ([72610c1](https://github.com/nodecg/nodecg/commit/72610c1a6ea0a990e918f388569977a5e4fba03d))
* mark more required deps as prod deps ([#627](https://github.com/nodecg/nodecg/issues/627)) ([bc2875a](https://github.com/nodecg/nodecg/commit/bc2875ae0828008366f08ef87d221a640e7f3559))
* **mounts:** put mount routes behind an auth check ([c99fa85](https://github.com/nodecg/nodecg/commit/c99fa8569e8c4f2a5e95890b7ee3d2fb7e1f61ea))
* **package:** fix error when running in a zeit pkg ([38b01e2](https://github.com/nodecg/nodecg/commit/38b01e2addaa89daf3dea10395b9afb0c749ec64))
* **package:** fix Steam auth not working ([59627a9](https://github.com/nodecg/nodecg/commit/59627a9feef76d7f9f70a99049aa009b547d053e))
* **package:** include babel-plugin-bare-import-rewrite in zeit packages ([9813da3](https://github.com/nodecg/nodecg/commit/9813da3523febb74a9629ce402bcfa20fff1d5db))
* **package:** include schemas folder in zeit pkg builds ([c38e463](https://github.com/nodecg/nodecg/commit/c38e463b737689a73619f788411468f47a2c7cce))
* **package:** make fs.extra a production dependency, instead of a devDependency ([5ac2c88](https://github.com/nodecg/nodecg/commit/5ac2c88edac185418c670e8acc9ae2730bd87bee))
* **package:** roll back nyc to v12 ([75c3332](https://github.com/nodecg/nodecg/commit/75c3332544c0fc2199bfaf82358624353568a8ec))
* **package:** roll node-localstorage to v1.3.1 ([56d8bb7](https://github.com/nodecg/nodecg/commit/56d8bb7af9cae3a5e12c7e93aa0db7d0df1a33dc))
* **package:** synchronize package-lock.json ([82a6e0b](https://github.com/nodecg/nodecg/commit/82a6e0bc9762e6169ea52ccd0d1135f4482a7348))
* **package:** update @nodecg/bundle-manager to 0.5.7 ([8890db3](https://github.com/nodecg/nodecg/commit/8890db31d751699f98dfda85fb05fb293ce62fda)), closes [#320](https://github.com/nodecg/nodecg/issues/320)
* **package:** update fs-extra to version 5.0.0 ([#352](https://github.com/nodecg/nodecg/issues/352)) ([629cc45](https://github.com/nodecg/nodecg/commit/629cc45095b56a00f9a1e9e8236b106cbca05650))
* **package:** update JSDoc ([a1a81c5](https://github.com/nodecg/nodecg/commit/a1a81c5c5bea7c5cf57a1a6c7ab8e68b2191c294))
* **package:** update make-fetch-happen to version 4.0.1 ([#389](https://github.com/nodecg/nodecg/issues/389)) ([7a44ca1](https://github.com/nodecg/nodecg/commit/7a44ca1dc42dc879b8a5925ccdae142040d5ec54)), closes [#382](https://github.com/nodecg/nodecg/issues/382)
* **package:** update nyc ([13256a8](https://github.com/nodecg/nodecg/commit/13256a82b0fe6bd41c14b75adbbcf8c42cb05126))
* **package:** update SoundJS to v1.0.0 ([ba26fc8](https://github.com/nodecg/nodecg/commit/ba26fc8bd4d4bae6a6190086342c527dbe8ed846))
* **package:** use npm audit to fix a lot of vulnerability warnings ([1b9dc96](https://github.com/nodecg/nodecg/commit/1b9dc960c2e83042a310fb6bd70e1193a06dd52f))
* remove debug print ([22e957b](https://github.com/nodecg/nodecg/commit/22e957bb859c3d05df4f13d386d449fcc167bd43))
* remove node warnings ([#567](https://github.com/nodecg/nodecg/issues/567)) ([5d5c494](https://github.com/nodecg/nodecg/commit/5d5c494a060782b67972fa098867ccea1803f845))
* remove undocumented and non-functional panelClick event ([1c20d58](https://github.com/nodecg/nodecg/commit/1c20d585395e57b907664d3d8cc7496289238e9b))
* remove undocumented dialog-confirm and dialog-dismiss attribute click handlers ([cab06b6](https://github.com/nodecg/nodecg/commit/cab06b631d68002fad3313963e09f794e6bfe413))
* remove unnecessary call to console.trace ([42e10a4](https://github.com/nodecg/nodecg/commit/42e10a4de2e1c23338f140a846974827ea88197a))
* **replicant-schemas:** fix local refs not being resolved when appended to a file ref ([0cd1673](https://github.com/nodecg/nodecg/commit/0cd1673edc619fb87b43696fbb1cbff2addc09ff))
* **replicants:** bind methods on objects when returning them via the proxy ([1987ce4](https://github.com/nodecg/nodecg/commit/1987ce4fee2b1c81a4dff23da362375533791d6c))
* **replicants:** clone default value ([#527](https://github.com/nodecg/nodecg/issues/527)) ([5ed1ed5](https://github.com/nodecg/nodecg/commit/5ed1ed5dae9aaec062dffbe8fd582ff00caa96b5))
* **replicants:** ensure opts.defaultValue always get populated ([#467](https://github.com/nodecg/nodecg/issues/467)) ([73fd909](https://github.com/nodecg/nodecg/commit/73fd9094fdefaa0816495e1510eefad6df50a223))
* **replicants:** harden logging of validation errors ([250b3fe](https://github.com/nodecg/nodecg/commit/250b3fec98d6070a26e7796a0d7c6126d33ab4fa))
* **replicants:** improve how revision mismatch errors are logged to console on the client ([e99dcbc](https://github.com/nodecg/nodecg/commit/e99dcbc72bbad1daa204784cda79dc530231a082))
* **replicants:** improve parsing of schema $refs ([6364396](https://github.com/nodecg/nodecg/commit/63643964b27c5ad2448695febf8dc4c6b4c465c2))
* **replicants:** prevent .once('change') listeners from potentially being called twice ([78a11c8](https://github.com/nodecg/nodecg/commit/78a11c8d0f0bc5bc7536a8d757c8cba9cbb7a7f8)), closes [#296](https://github.com/nodecg/nodecg/issues/296)
* **replicants:** properly load schemas when schemaPath is absolute ([4201906](https://github.com/nodecg/nodecg/commit/420190675ce91f2c294b773631dc46707da13645))
* **replicants:** remove custom schema properties ([#676](https://github.com/nodecg/nodecg/issues/676)) ([6ae4a49](https://github.com/nodecg/nodecg/commit/6ae4a4984d43dc327e85793e27eaffc54323ea69))
* **replicants:** set status to "declared" _before_ emitting the post-declare change event ([a62d25d](https://github.com/nodecg/nodecg/commit/a62d25df80546cb5ee7c7ef3533e7e7568351d10))
* **replicants:** support schemas with internal $refs ([ee1c394](https://github.com/nodecg/nodecg/commit/ee1c394fe7a1f31e216c2409c1817fb6df678466))
* **replicator:** don't crash when a an error occurs while updating the persisted value of a replicant ([54baa0e](https://github.com/nodecg/nodecg/commit/54baa0e6784b43bb9f80a56f0af3c02e83a37729))
* **replicator:** use mkdirp when ensuring that the db/replicants folder exists ([7b952f4](https://github.com/nodecg/nodecg/commit/7b952f44db296cd9fbf23bae56ed07c2b0c64e63))
* **router:** delay 404 resolution ([#463](https://github.com/nodecg/nodecg/issues/463)) ([23e5772](https://github.com/nodecg/nodecg/commit/23e577237205fa08de84e3fe445f535f4046d082))
* **sentry:** fix git information not being updated during runtime ([1d34d4b](https://github.com/nodecg/nodecg/commit/1d34d4b4bffff7e3a1fc48fb471ddcb49d556291))
* **server:** don't crash when `/instance/**/*.html` route 404s ([#636](https://github.com/nodecg/nodecg/issues/636)) ([c59adc8](https://github.com/nodecg/nodecg/commit/c59adc8bc24374a1a30f5cab272606b440b300d0))
* **server:** fix unhandledRejection handler ([e4efa9f](https://github.com/nodecg/nodecg/commit/e4efa9feb84cf7f092c284346e3b22dc776b28e5))
* **server:** prevent 'can't set headers after they are sent' error spam ([#387](https://github.com/nodecg/nodecg/issues/387)) ([58357bf](https://github.com/nodecg/nodecg/commit/58357bfe6078248ca4d9850235d3bca71ad78e61))
* **server:** prevent another possible (but unreproduced) directory traversal attack ([#643](https://github.com/nodecg/nodecg/issues/643)) ([ca2208c](https://github.com/nodecg/nodecg/commit/ca2208c32304c5ee7750925f7481104a81f4cddc))
* **server:** prevent directory traversal attacks ([#639](https://github.com/nodecg/nodecg/issues/639)) ([0646587](https://github.com/nodecg/nodecg/commit/0646587c1057b3a19eace430d979b6a502a4e8a7))
* **socket:** correct maxListeners setting to prevent memory leak ([#579](https://github.com/nodecg/nodecg/issues/579)) ([1b0611b](https://github.com/nodecg/nodecg/commit/1b0611bfdfa07d57c604b4e7bd5e1cf22d36b142))
* **soundcue:** fix soundcue files not persisting ([#584](https://github.com/nodecg/nodecg/issues/584)) ([eeac8c4](https://github.com/nodecg/nodecg/commit/eeac8c43ace1fd1dbba9fe5ebed4301ed721cdaf))
* **sounds:** remove undocumented customCues system ([efe877e](https://github.com/nodecg/nodecg/commit/efe877e79f96c801109479756e193e4ab1d0edff))
* support uploading files with non-ascii characters in their filenames ([#657](https://github.com/nodecg/nodecg/issues/657)) ([318332e](https://github.com/nodecg/nodecg/commit/318332e71b176389b0da4cb639f9b10bf1694147))
* **types:** add persistenceInterval option ([#572](https://github.com/nodecg/nodecg/issues/572)) ([84c3c46](https://github.com/nodecg/nodecg/commit/84c3c463c1ee27fe8cc2e0e3fc8177cdccc91e14))
* **types:** Add sendMessageToBundle instance method to type definitions ([#480](https://github.com/nodecg/nodecg/issues/480)) ([a15fe3b](https://github.com/nodecg/nodecg/commit/a15fe3bc2069fc1b4495ceba9d885abb7b429763))
* **types:** add/tweak types for replicant/readReplicant ([#545](https://github.com/nodecg/nodecg/issues/545)) ([f391281](https://github.com/nodecg/nodecg/commit/f391281463044cffca2e1b614ea3a0a163a99fce))
* **types:** correct typing for declared replicants ([#596](https://github.com/nodecg/nodecg/issues/596)) ([dea9c15](https://github.com/nodecg/nodecg/commit/dea9c154d161069e2c14c6ad3def5d6373a5b7b9))
* **types:** remove optional parameters in callback ([81b0a11](https://github.com/nodecg/nodecg/commit/81b0a11ba33b084a0884900b9d973ed5e8814a27))
* unlisten overload missing ([#659](https://github.com/nodecg/nodecg/issues/659)) ([d387aec](https://github.com/nodecg/nodecg/commit/d387aecc01f410838691a8befaa0b170df14f9cb))
* update better-sqlite3 ([#668](https://github.com/nodecg/nodecg/issues/668)) ([a66c19d](https://github.com/nodecg/nodecg/commit/a66c19d666b0e647d69315a7d55f8699a8b55a07))
* update Node.js version check ([#438](https://github.com/nodecg/nodecg/issues/438)) ([086621d](https://github.com/nodecg/nodecg/commit/086621db426bb72d94646ce40567e6668b3145fd))
* validation of URI in json schema for certain spec drafts ([#663](https://github.com/nodecg/nodecg/issues/663)) ([4076a5d](https://github.com/nodecg/nodecg/commit/4076a5d4bacf9ff7f34ea85b98a0a7378f29697f))
* **zeit_pkg:** fix pkg'd executables not working when compiled on a drive other than C: ([#498](https://github.com/nodecg/nodecg/issues/498)) ([3ae9b75](https://github.com/nodecg/nodecg/commit/3ae9b75c0edfd648f7f267522fc799259977ecc4))


### Performance Improvements

* implement polymer-build ([#286](https://github.com/nodecg/nodecg/issues/286)) ([cad6a42](https://github.com/nodecg/nodecg/commit/cad6a42dba06a5fd7e6f50c64dab7ddcd51248b3))
* replace deep-equal and clone with fast-equals and klona/json ([#661](https://github.com/nodecg/nodecg/issues/661)) ([a4cc07b](https://github.com/nodecg/nodecg/commit/a4cc07bb9a09e96d2c49a1a805c9a7447a7ee1c7))


### Reverts

* support Node.js 8 [#513](https://github.com/nodecg/nodecg/issues/513) [#517](https://github.com/nodecg/nodecg/issues/517) ([#525](https://github.com/nodecg/nodecg/issues/525)) ([21feac3](https://github.com/nodecg/nodecg/commit/21feac3920e7827b8781e13dfd324b39d7d909b9))


### Code Refactoring

* **dashboard:** port to Polymer 2 ([2084237](https://github.com/nodecg/nodecg/commit/20842379f5a65142da1c29c0ac5b879e4cdde2fe)), closes [#218](https://github.com/nodecg/nodecg/issues/218)
* merge @nodecg/bundle-manager back in ([fdefeac](https://github.com/nodecg/nodecg/commit/fdefeac5d01fc9966f217c8f7246edefe8bda043))

## [2.1.12](https://github.com/nodecg/nodecg/compare/v2.1.11...v2.1.12) (2023-11-16)


### Bug Fixes

* `iframe-resizer` content window injection ([#679](https://github.com/nodecg/nodecg/issues/679)) ([78f80ba](https://github.com/nodecg/nodecg/commit/78f80ba31305d2d982eede8cb7e1b604844a31fb))
* **config loader:** handle when cfg is symlink ([#670](https://github.com/nodecg/nodecg/issues/670)) ([50f0c11](https://github.com/nodecg/nodecg/commit/50f0c11b4672fe2103cd0e5b343e7559dbf08c68))
* **replicants:** remove custom schema properties ([#676](https://github.com/nodecg/nodecg/issues/676)) ([6ae4a49](https://github.com/nodecg/nodecg/commit/6ae4a4984d43dc327e85793e27eaffc54323ea69))

## [2.1.11](https://github.com/nodecg/nodecg/compare/v2.1.10...v2.1.11) (2023-06-28)


### Bug Fixes

* update better-sqlite3 ([#668](https://github.com/nodecg/nodecg/issues/668)) ([a66c19d](https://github.com/nodecg/nodecg/commit/a66c19d666b0e647d69315a7d55f8699a8b55a07))

## [2.1.10](https://github.com/nodecg/nodecg/compare/v2.1.9...v2.1.10) (2023-06-26)


### Bug Fixes

* always emit full user object on `login` event; only emit `login` and `logout` events for allowed users ([#666](https://github.com/nodecg/nodecg/issues/666)) ([9da8b02](https://github.com/nodecg/nodecg/commit/9da8b029a49ddd471774ad8f96ae0d201ad05b09))

## [2.1.9](https://github.com/nodecg/nodecg/compare/v2.1.8...v2.1.9) (2023-06-24)


### Bug Fixes

* validation of URI in json schema for certain spec drafts ([#663](https://github.com/nodecg/nodecg/issues/663)) ([4076a5d](https://github.com/nodecg/nodecg/commit/4076a5d4bacf9ff7f34ea85b98a0a7378f29697f))


### Performance Improvements

* replace deep-equal and clone with fast-equals and klona/json ([#661](https://github.com/nodecg/nodecg/issues/661)) ([a4cc07b](https://github.com/nodecg/nodecg/commit/a4cc07bb9a09e96d2c49a1a805c9a7447a7ee1c7))

## [2.1.8](https://github.com/nodecg/nodecg/compare/v2.1.7...v2.1.8) (2023-06-12)


### Bug Fixes

* unlisten overload missing ([#659](https://github.com/nodecg/nodecg/issues/659)) ([d387aec](https://github.com/nodecg/nodecg/commit/d387aecc01f410838691a8befaa0b170df14f9cb))

## [2.1.7](https://github.com/nodecg/nodecg/compare/v2.1.6...v2.1.7) (2023-06-06)


### Bug Fixes

* support uploading files with non-ascii characters in their filenames ([#657](https://github.com/nodecg/nodecg/issues/657)) ([318332e](https://github.com/nodecg/nodecg/commit/318332e71b176389b0da4cb639f9b10bf1694147))

## [2.1.6](https://github.com/nodecg/nodecg/compare/v2.1.5...v2.1.6) (2023-06-05)


### Bug Fixes

* correct full update read code ([#652](https://github.com/nodecg/nodecg/issues/652)) ([490d033](https://github.com/nodecg/nodecg/commit/490d033b0e7040535bac9c07d569194555c59b08))

## [2.1.5](https://github.com/nodecg/nodecg/compare/v2.1.4...v2.1.5) (2023-05-20)


### Bug Fixes

* avoid using process.env.browser to avoid real-world env conflicts ([#649](https://github.com/nodecg/nodecg/issues/649)) ([e2c80e0](https://github.com/nodecg/nodecg/commit/e2c80e03bd217854f5bca3a06dd0bdf4e7e0961f))

## [2.1.4](https://github.com/nodecg/nodecg/compare/v2.1.3...v2.1.4) (2023-05-15)


### Bug Fixes

* fix error when running NodeCG after installation as a dependency via npm ([#647](https://github.com/nodecg/nodecg/issues/647)) ([3aaaae8](https://github.com/nodecg/nodecg/commit/3aaaae8d71bfecb3966e34e304aaac003e3e063c))

## [2.1.3](https://github.com/nodecg/nodecg/compare/v2.1.2...v2.1.3) (2023-04-24)


### Bug Fixes

* **dockerfile:** CMD to absolute path ([#645](https://github.com/nodecg/nodecg/issues/645)) ([eeebf0e](https://github.com/nodecg/nodecg/commit/eeebf0e13cac9f665acb293c3a41e89cdac3f666))

## [2.1.2](https://github.com/nodecg/nodecg/compare/v2.1.1...v2.1.2) (2023-04-02)


### Bug Fixes

* **server:** prevent another possible (but unreproduced) directory traversal attack ([#643](https://github.com/nodecg/nodecg/issues/643)) ([ca2208c](https://github.com/nodecg/nodecg/commit/ca2208c32304c5ee7750925f7481104a81f4cddc))

## [2.1.1](https://github.com/nodecg/nodecg/compare/v2.1.0...v2.1.1) (2023-03-26)


### Bug Fixes

* **server:** don't crash when `/instance/**/*.html` route 404s ([#636](https://github.com/nodecg/nodecg/issues/636)) ([c59adc8](https://github.com/nodecg/nodecg/commit/c59adc8bc24374a1a30f5cab272606b440b300d0))
* **server:** prevent directory traversal attacks ([#639](https://github.com/nodecg/nodecg/issues/639)) ([0646587](https://github.com/nodecg/nodecg/commit/0646587c1057b3a19eace430d979b6a502a4e8a7))

## [2.1.0](https://github.com/nodecg/nodecg/compare/v2.0.4...v2.1.0) (2023-03-25)


### Features

* **docker:** smaller docker image ([#631](https://github.com/nodecg/nodecg/issues/631)) ([f560619](https://github.com/nodecg/nodecg/commit/f56061921f2fb188031920925c6a9818be459063))


### Bug Fixes

* allow socket authentication with a token only ([#635](https://github.com/nodecg/nodecg/issues/635)) ([0241071](https://github.com/nodecg/nodecg/commit/024107127e97685bdaa4f95e7d817b42a135085a))

## [2.0.4](https://github.com/nodecg/nodecg/compare/v2.0.3...v2.0.4) (2023-03-24)


### Bug Fixes

* **login:** fix `key=xxx` URLs not working ([#629](https://github.com/nodecg/nodecg/issues/629)) ([6c21ff0](https://github.com/nodecg/nodecg/commit/6c21ff00df9fe5725396275d0d5738244b13d3eb))

## [2.0.3](https://github.com/nodecg/nodecg/compare/v2.0.2...v2.0.3) (2023-03-24)


### Bug Fixes

* mark more required deps as prod deps ([#627](https://github.com/nodecg/nodecg/issues/627)) ([bc2875a](https://github.com/nodecg/nodecg/commit/bc2875ae0828008366f08ef87d221a640e7f3559))

## [2.0.2](https://github.com/nodecg/nodecg/compare/v2.0.1...v2.0.2) (2023-03-24)


### Bug Fixes

* include templates in server build outputs ([#625](https://github.com/nodecg/nodecg/issues/625)) ([cdd8bf2](https://github.com/nodecg/nodecg/commit/cdd8bf2cf7c7b0821212d99d777b9d45e2d27e6a))
* make node-fetch-commonjs a prod dep ([#623](https://github.com/nodecg/nodecg/issues/623)) ([72610c1](https://github.com/nodecg/nodecg/commit/72610c1a6ea0a990e918f388569977a5e4fba03d))

## [2.0.1](https://github.com/nodecg/nodecg/compare/v2.0.0...v2.0.1) (2023-03-23)


### Bug Fixes

* **docker:** fix failing Dockerfile ([#617](https://github.com/nodecg/nodecg/issues/617)) ([1e243da](https://github.com/nodecg/nodecg/commit/1e243dac2a9d9f107cdcd57959851f62a8c05b50))
* don't list package-lock in files ([#620](https://github.com/nodecg/nodecg/issues/620)) ([e2ed466](https://github.com/nodecg/nodecg/commit/e2ed4668402c308ffddf1a2aebc93565e3d537fd))

## [2.0.0](https://github.com/nodecg/nodecg/compare/v1.9.0...v2.0.0) (2023-03-23)


### ⚠ BREAKING CHANGES

* details at https://www.nodecg.dev/docs/migrating/migrating-1.x-to-2.x

### Features

* port to typescript ([#546](https://github.com/nodecg/nodecg/issues/546)) ([0060f49](https://github.com/nodecg/nodecg/commit/0060f49d2c5f1f7d91adf93f41d914eb8b81b702))

## [1.9.0](https://github.com/nodecg/nodecg/compare/v1.8.1...v1.9.0) (2022-03-30)

### Features

- **auth:** discord login option ([#571](https://github.com/nodecg/nodecg/issues/571)) ([3df008e](https://github.com/nodecg/nodecg/commit/3df008e158bee2a9ba50627df9c1a90c86ceac3d))
- **extension:** allow extensions to export esmodule ([#587](https://github.com/nodecg/nodecg/issues/587)) ([8e3304a](https://github.com/nodecg/nodecg/commit/8e3304a164e74afdfb5464c870fba5c55dd663de))
- **login:** add twitch id whitelisting ([#583](https://github.com/nodecg/nodecg/issues/583)) ([e83933f](https://github.com/nodecg/nodecg/commit/e83933f1515bb282bc0d98a926302b8c460ddfc7))

### Bug Fixes

- **dashboard:** correct URL for obs drag when login is enabled ([#585](https://github.com/nodecg/nodecg/issues/585)) ([9046287](https://github.com/nodecg/nodecg/commit/904628737efdd0c239119757c0b55efe4cf4a761))
- **dashboard:** fix the currently selected workspace not being highlighted on first page load ([#538](https://github.com/nodecg/nodecg/issues/538)) ([3442d76](https://github.com/nodecg/nodecg/commit/3442d760585ee23f5fec568b6a194b734dac5be5))
- **socket:** correct maxListeners setting to prevent memory leak ([#579](https://github.com/nodecg/nodecg/issues/579)) ([1b0611b](https://github.com/nodecg/nodecg/commit/1b0611bfdfa07d57c604b4e7bd5e1cf22d36b142))
- **soundcue:** fix soundcue files not persisting ([#584](https://github.com/nodecg/nodecg/issues/584)) ([eeac8c4](https://github.com/nodecg/nodecg/commit/eeac8c43ace1fd1dbba9fe5ebed4301ed721cdaf))
- **types:** add/tweak types for replicant/readReplicant ([#545](https://github.com/nodecg/nodecg/issues/545)) ([f391281](https://github.com/nodecg/nodecg/commit/f391281463044cffca2e1b614ea3a0a163a99fce))
- **types:** correct typing for declared replicants ([#596](https://github.com/nodecg/nodecg/issues/596)) ([dea9c15](https://github.com/nodecg/nodecg/commit/dea9c154d161069e2c14c6ad3def5d6373a5b7b9))

### [1.8.1](https://github.com/nodecg/nodecg/compare/v1.8.0...v1.8.1) (2021-03-10)

### Bug Fixes

- better log formatting and configurable timestamps ([#575](https://github.com/nodecg/nodecg/issues/575)) ([dd323cd](https://github.com/nodecg/nodecg/commit/dd323cd72dc38343d35a374158e5e1bfde70ddfd))
- **deps:** fix some vulnerabilities of dependency ([81c9ee2](https://github.com/nodecg/nodecg/commit/81c9ee2edb296e5bef5b8d5df7e0c9ddc9279d5b))

## [1.8.0](https://github.com/nodecg/nodecg/compare/v1.7.4...v1.8.0) (2021-03-08)

### Features

- **replicants:** remove local storage size quota ([#574](https://github.com/nodecg/nodecg/issues/574)) ([10bfd6f](https://github.com/nodecg/nodecg/commit/10bfd6ff87107fde16459140792cbc590f8497a0))

### Bug Fixes

- **types:** add persistenceInterval option ([#572](https://github.com/nodecg/nodecg/issues/572)) ([84c3c46](https://github.com/nodecg/nodecg/commit/84c3c463c1ee27fe8cc2e0e3fc8177cdccc91e14))

### [1.7.4](https://github.com/nodecg/nodecg/compare/v1.7.3...v1.7.4) (2020-12-11)

### Bug Fixes

- remove node warnings ([#567](https://github.com/nodecg/nodecg/issues/567)) ([5d5c494](https://github.com/nodecg/nodecg/commit/5d5c494))

### [1.7.3](https://github.com/nodecg/nodecg/compare/v1.7.2...v1.7.3) (2020-12-11)

### Bug Fixes

- **deps:** update express-bare-module-specifiers ([bd1d925](https://github.com/nodecg/nodecg/commit/bd1d925))

### [1.7.2](https://github.com/nodecg/nodecg/compare/v1.7.1...v1.7.2) (2020-11-20)

### Bug Fixes

- **deps:** switch json-schema-lib repo ([7b7c7c1](https://github.com/nodecg/nodecg/commit/7b7c7c1))

### [1.7.1](https://github.com/nodecg/nodecg/compare/v1.7.0...v1.7.1) (2020-10-02)

### Bug Fixes

- **assets:** filename ([#564](https://github.com/nodecg/nodecg/issues/564)) ([ddf936c](https://github.com/nodecg/nodecg/commit/ddf936c))

## [1.7.0](https://github.com/nodecg/nodecg/compare/v1.6.1...v1.7.0) (2020-09-20)

### Bug Fixes

- **deps:** update dependencies through npm audit ([a871f4b](https://github.com/nodecg/nodecg/commit/a871f4b))

### Features

- **dashboard:** Add graphic obs drag parameters ([#561](https://github.com/nodecg/nodecg/issues/561)) ([5c5a833](https://github.com/nodecg/nodecg/commit/5c5a833))

### [1.6.1](https://github.com/nodecg/nodecg/compare/v1.6.0...v1.6.1) (2020-04-30)

### Bug Fixes

- **auth:** send Client-ID header on all Twitch API requests ([#550](https://github.com/nodecg/nodecg/issues/550)) ([12d2a5e](https://github.com/nodecg/nodecg/commit/12d2a5e))

## [1.6.0](https://github.com/nodecg/nodecg/compare/v1.5.0...v1.6.0) (2020-02-24)

### Bug Fixes

- **bundle-parser:** check version when parsing ([#510](https://github.com/nodecg/nodecg/issues/510)) ([484d839](https://github.com/nodecg/nodecg/commit/484d839))
- **replicants:** clone default value ([#527](https://github.com/nodecg/nodecg/issues/527)) ([5ed1ed5](https://github.com/nodecg/nodecg/commit/5ed1ed5))

### Features

- **deps:** update chokidar to v3 ([#515](https://github.com/nodecg/nodecg/issues/515)) ([f468825](https://github.com/nodecg/nodecg/commit/f468825))
- **docker:** bump node to 10 ([#533](https://github.com/nodecg/nodecg/issues/533)) ([6fafeea](https://github.com/nodecg/nodecg/commit/6fafeea))
- **extension:** add router helper ([#535](https://github.com/nodecg/nodecg/issues/535)) ([2a69423](https://github.com/nodecg/nodecg/commit/2a69423))
- **extension:** flexible mount ([#519](https://github.com/nodecg/nodecg/issues/519)) ([3ff1603](https://github.com/nodecg/nodecg/commit/3ff1603))

## [1.5.0](https://github.com/nodecg/nodecg/compare/v1.4.1...v1.5.0) (2019-08-06)

### Features

- **login:** expose refresh token from Twitch login authentication ([#504](https://github.com/nodecg/nodecg/issues/504)) ([b710314](https://github.com/nodecg/nodecg/commit/b710314))
- add bundle paths customization ([#483](https://github.com/nodecg/nodecg/issues/483)) ([56ef32a](https://github.com/nodecg/nodecg/commit/56ef32a))
- **replicants:** update persistence process ([#497](https://github.com/nodecg/nodecg/issues/497)) ([16fcefd](https://github.com/nodecg/nodecg/commit/16fcefd)), closes [#493](https://github.com/nodecg/nodecg/issues/493) [#488](https://github.com/nodecg/nodecg/issues/488)

### [1.4.1](https://github.com/nodecg/nodecg/compare/v1.4.0...v1.4.1) (2019-07-16)

### Bug Fixes

- **instance-errors:** Update help text & design ([#494](https://github.com/nodecg/nodecg/issues/494)) ([7fcf6ee](https://github.com/nodecg/nodecg/commit/7fcf6ee))
- **types:** Add sendMessageToBundle instance method to type definitions ([#480](https://github.com/nodecg/nodecg/issues/480)) ([a15fe3b](https://github.com/nodecg/nodecg/commit/a15fe3b))
- **zeit_pkg:** fix pkg'd executables not working when compiled on a drive other than C: ([#498](https://github.com/nodecg/nodecg/issues/498)) ([3ae9b75](https://github.com/nodecg/nodecg/commit/3ae9b75))

### Build System

- **docker:** don't ignore types folder ([4c0e65c](https://github.com/nodecg/nodecg/commit/4c0e65c))

# [1.4.0](https://github.com/nodecg/nodecg/compare/v1.3.2...v1.4.0) (2019-04-19)

### Features

- add multiple bundles paths support ([#470](https://github.com/nodecg/nodecg/issues/470)) ([3b76451](https://github.com/nodecg/nodecg/commit/3b76451))

<a name="1.3.2"></a>

## [1.3.2](https://github.com/nodecg/nodecg/compare/v1.3.1...v1.3.2) (2019-03-06)

### Bug Fixes

- **replicants:** ensure opts.defaultValue always get populated ([#467](https://github.com/nodecg/nodecg/issues/467)) ([73fd909](https://github.com/nodecg/nodecg/commit/73fd909))

### Features

- **typedef:** Export more types in browser.d.ts ([#465](https://github.com/nodecg/nodecg/issues/465)) ([0455036](https://github.com/nodecg/nodecg/commit/0455036))

<a name="1.3.1"></a>

## [1.3.1](https://github.com/nodecg/nodecg/compare/v1.3.0...v1.3.1) (2019-02-03)

### Bug Fixes

- **dashboard:** ensure the default workspace is first ([#458](https://github.com/nodecg/nodecg/issues/458)) ([18fdbe6](https://github.com/nodecg/nodecg/commit/18fdbe6))
- **dashboard:** inject default styles before user styles ([#464](https://github.com/nodecg/nodecg/issues/464)) ([5981d9e](https://github.com/nodecg/nodecg/commit/5981d9e))
- **injectscripts:** don't inject client_registration into busy.html or killed.html ([0a63202](https://github.com/nodecg/nodecg/commit/0a63202))
- **package:** fix error when running in a zeit pkg ([38b01e2](https://github.com/nodecg/nodecg/commit/38b01e2))
- **package:** include babel-plugin-bare-import-rewrite in zeit packages ([9813da3](https://github.com/nodecg/nodecg/commit/9813da3))
- **replicant-schemas:** fix local refs not being resolved when appended to a file ref ([0cd1673](https://github.com/nodecg/nodecg/commit/0cd1673))
- **router:** delay 404 resolution ([#463](https://github.com/nodecg/nodecg/issues/463)) ([23e5772](https://github.com/nodecg/nodecg/commit/23e5772))

<a name="1.3.0"></a>

# [1.3.0](https://github.com/nodecg/nodecg/compare/v1.2.2...v1.3.0) (2018-11-19)

### Bug Fixes

- **dashboard:** Sort all dashboard workspaces alphabetically ([#450](https://github.com/nodecg/nodecg/issues/450)) ([786f23f](https://github.com/nodecg/nodecg/commit/786f23f))

### Features

- **login:** add password hashing support for local auth ([#446](https://github.com/nodecg/nodecg/issues/446)) ([cf6192b](https://github.com/nodecg/nodecg/commit/cf6192b))
- rewrite bare module specifiers ([#454](https://github.com/nodecg/nodecg/issues/454)) ([4500ccd](https://github.com/nodecg/nodecg/commit/4500ccd))

<a name="1.2.2"></a>

## [1.2.2](https://github.com/nodecg/nodecg/compare/v1.1.3...v1.2.2) (2018-10-30)

### Bug Fixes

- update Node.js version check ([#438](https://github.com/nodecg/nodecg/issues/438)) ([086621d](https://github.com/nodecg/nodecg/commit/086621d))
- **types:** remove optional parameters in callback ([81b0a11](https://github.com/nodecg/nodecg/commit/81b0a11))

### Features

- **security:** add support for passphrase for SSL key ([#437](https://github.com/nodecg/nodecg/issues/437)) ([c444d9b](https://github.com/nodecg/nodecg/commit/c444d9b))
- replace Pug by Lodash with cache ([83404d1](https://github.com/nodecg/nodecg/commit/83404d1))
- **TypeScript:** Add NodeCG API TypeScript Type Definition ([#432](https://github.com/nodecg/nodecg/issues/432)) ([9372ca4](https://github.com/nodecg/nodecg/commit/9372ca4))

<a name="1.1.3"></a>

## [1.1.3](https://github.com/nodecg/nodecg/compare/v1.1.2...v1.1.3) (2018-08-05)

### Bug Fixes

- **dashboard:** also target root html for theme import ([0948f5f](https://github.com/nodecg/nodecg/commit/0948f5f))
- **dashboard:** fix text and icon colors of Asset upload dialog ([d1d3a45](https://github.com/nodecg/nodecg/commit/d1d3a45))
- **dashboard:** implement missing dark theme for bundle dialogs ([d14158f](https://github.com/nodecg/nodecg/commit/d14158f))
- **package:** roll node-localstorage to v1.3.1 ([56d8bb7](https://github.com/nodecg/nodecg/commit/56d8bb7))

<a name="1.1.2"></a>

## [1.1.2](https://github.com/nodecg/nodecg/compare/v1.1.1...v1.1.2) (2018-07-19)

### Bug Fixes

- **dashboard:** fix graphic instances not appearing when using a bundle that is not a git repo ([54cfcd6](https://github.com/nodecg/nodecg/commit/54cfcd6))

<a name="1.1.1"></a>

## [1.1.1](https://github.com/nodecg/nodecg/compare/v1.1.0...v1.1.1) (2018-07-19)

### Bug Fixes

- **dashboard:** fix missing background color on graphics collapse toggle button ([9e6bc4d](https://github.com/nodecg/nodecg/commit/9e6bc4d))
- **package:** include schemas folder in zeit pkg builds ([c38e463](https://github.com/nodecg/nodecg/commit/c38e463))

<a name="1.1.0"></a>

# [1.1.0](https://github.com/nodecg/nodecg/compare/v1.0.0...v1.1.0) (2018-07-19)

### Features

- **api:** add nodecg.bundleGit object ([#418](https://github.com/nodecg/nodecg/issues/418)) ([dfe0b95](https://github.com/nodecg/nodecg/commit/dfe0b95))
- **api:** add nodecg.bundleVersion to api ([#459](https://github.com/nodecg/nodecg/issues/459)) ([170142b](https://github.com/nodecg/nodecg/commit/170142b))
- **api:** introduce bundles replicant ([#421](https://github.com/nodecg/nodecg/issues/421)) ([94d0b1d](https://github.com/nodecg/nodecg/commit/94d0b1d))
- **dashboard:** implement dark theme ([#425](https://github.com/nodecg/nodecg/issues/425)) ([0dafe4e](https://github.com/nodecg/nodecg/commit/0dafe4e))
- **dashboard:** implement redesigned graphics tab with refresh buttons ([#420](https://github.com/nodecg/nodecg/issues/420)) ([215f489](https://github.com/nodecg/nodecg/commit/215f489))

<a name="1.0.0"></a>

# [1.0.0](https://github.com/nodecg/nodecg/compare/v0.9.12...v1.0.0) (2018-07-11)

### Bug Fixes

- remove undocumented and non-functional panelClick event ([1c20d58](https://github.com/nodecg/nodecg/commit/1c20d58))
- remove undocumented dialog-confirm and dialog-dismiss attribute click handlers ([cab06b6](https://github.com/nodecg/nodecg/commit/cab06b6))
- **assets:** fix "can't set headers..." error ([#411](https://github.com/nodecg/nodecg/issues/411)) ([518cf21](https://github.com/nodecg/nodecg/commit/518cf21))
- **dashboard:** remove useless and busted-looking "info" dialog from panels ([22499bd](https://github.com/nodecg/nodecg/commit/22499bd))
- **login:** use the New Twitch API ([#413](https://github.com/nodecg/nodecg/issues/413)) ([6696231](https://github.com/nodecg/nodecg/commit/6696231))
- **mounts:** put mount routes behind an auth check ([c99fa85](https://github.com/nodecg/nodecg/commit/c99fa85))
- **sounds:** remove undocumented customCues system ([efe877e](https://github.com/nodecg/nodecg/commit/efe877e))

### Features

- **api:** add support for intra-context messaging ([#410](https://github.com/nodecg/nodecg/issues/410)) ([3a3acf7](https://github.com/nodecg/nodecg/commit/3a3acf7))
- **api:** support multiple listenFor handlers ([#403](https://github.com/nodecg/nodecg/issues/403)) ([f19c79b](https://github.com/nodecg/nodecg/commit/f19c79b)), closes [#298](https://github.com/nodecg/nodecg/issues/298)
- **bundle-manager:** blacklisted bundle directory names ([#357](https://github.com/nodecg/nodecg/issues/357)) ([68e7add](https://github.com/nodecg/nodecg/commit/68e7add))

### BREAKING CHANGES

- **dashboard**: The undocumented `[dialog-confirm]` and `[dialog-dismiss]` attribute click handlers have been removed.
- **dashboard**: The undocumented (and broken) `panelClick` event has been removed.
- **api:** sendMessage can now trigger listenFor handlers in the same context (extension, webpage, etc).
- **login:** The format of Twitch auth scopes has changed. Please see https://dev.twitch.tv/docs/authentication/#scopes for documentation on this new format.
- **login:** Twitch auth now uses the "New Twitch API", instead of the deprecated "v5" API.
- **api:** A given context (server, client) can now declare multiple listenFor handlers for a given message. Handlers are called in the order they were registered.

However, a server-side listenFor handler must be careful to only call an acknowledgement once. Attempting to call an acknowledgement more than once will throw an error.

Your server-side code can check if an acknowledgement has already been called/handled by checking its `.handled` property.

Example:

```js
nodecg.listenFor('example', (data, ack) => {
  if (ack && !ack.handled) {
    ack();
  }
});
```

- **sounds:** The undocumented customCues system has been removed.

<a name="0.9.12"></a>

## [0.9.12](https://github.com/nodecg/nodecg/compare/v0.9.11...v0.9.12) (2018-07-05)

### Bug Fixes

- **bundles:** avoid throwing exception on Unicode BOM ([#401](https://github.com/nodecg/nodecg/issues/401)) ([84a4555](https://github.com/nodecg/nodecg/commit/84a4555))
- **package:** use npm audit to fix a lot of vulnerability warnings ([1b9dc96](https://github.com/nodecg/nodecg/commit/1b9dc96))

### Features

- **api:** add NodeCG.waitForReplicants method ([b8d3ed1](https://github.com/nodecg/nodecg/commit/b8d3ed1))
- **auth:** add basic local authentication ([#390](https://github.com/nodecg/nodecg/issues/390)) ([54bbcf6](https://github.com/nodecg/nodecg/commit/54bbcf6))

<a name="0.9.11"></a>

## [0.9.11](https://github.com/nodecg/nodecg/compare/v0.9.10...v0.9.11) (2018-05-03)

### Bug Fixes

- **dashboard:** always send 'dialog-dismissed' when clicking outside the dialog ([#385](https://github.com/nodecg/nodecg/issues/385)) ([da30fe1](https://github.com/nodecg/nodecg/commit/da30fe1))
- **dashboard:** support the nodecg-dialog attribute within shadow roots ([#384](https://github.com/nodecg/nodecg/issues/384)) ([fc62adf](https://github.com/nodecg/nodecg/commit/fc62adf))
- **logger:** improve formatting of errors reported to Sentry via the .error method ([cb6426e](https://github.com/nodecg/nodecg/commit/cb6426e))
- **package:** fix Steam auth not working ([59627a9](https://github.com/nodecg/nodecg/commit/59627a9))
- **package:** update make-fetch-happen to version 4.0.1 ([#389](https://github.com/nodecg/nodecg/issues/389)) ([7a44ca1](https://github.com/nodecg/nodecg/commit/7a44ca1)), closes [#382](https://github.com/nodecg/nodecg/issues/382)
- **server:** prevent 'can't set headers after they are sent' error spam ([#387](https://github.com/nodecg/nodecg/issues/387)) ([58357bf](https://github.com/nodecg/nodecg/commit/58357bf))

<a name="0.9.10"></a>

## [0.9.10](https://github.com/nodecg/nodecg/compare/v0.9.9...v0.9.10) (2018-03-08)

### Bug Fixes

- **package:** synchronize package-lock.json ([82a6e0b](https://github.com/nodecg/nodecg/commit/82a6e0b))
- **package:** update SoundJS to v1.0.0 ([ba26fc8](https://github.com/nodecg/nodecg/commit/ba26fc8)), closes [#371](https://github.com/nodecg/nodecg/issues/371)
- **replicants:** bind methods on objects when returning them via the proxy ([1987ce4](https://github.com/nodecg/nodecg/commit/1987ce4))

### Features

- **bundles:** avoid crash when a bundle becomes invalid after a change ([#374](https://github.com/nodecg/nodecg/issues/374)) ([4d42335](https://github.com/nodecg/nodecg/commit/4d42335))

<a name="0.9.9"></a>

## [0.9.9](https://github.com/nodecg/nodecg/compare/v0.9.8...v0.9.9) (2018-01-18)

### Bug Fixes

- **extensions:** improve logging when an extension fails to mount ([e7f2a90](https://github.com/nodecg/nodecg/commit/e7f2a90))
- **login:** Redirect to /login after destroying session ([#355](https://github.com/nodecg/nodecg/issues/355)) ([30aa4ba](https://github.com/nodecg/nodecg/commit/30aa4ba))
- **package:** update fs-extra to version 5.0.0 ([#352](https://github.com/nodecg/nodecg/issues/352)) ([629cc45](https://github.com/nodecg/nodecg/commit/629cc45))
- **replicator:** don't crash when a an error occurs while updating the persisted value of a replicant ([54baa0e](https://github.com/nodecg/nodecg/commit/54baa0e))
- **replicator:** use mkdirp when ensuring that the db/replicants folder exists ([7b952f4](https://github.com/nodecg/nodecg/commit/7b952f4))

### Features

- add mounting feature ([07210b0](https://github.com/nodecg/nodecg/commit/07210b0))
- **bundles:** support loading assets from node_modules ([#358](https://github.com/nodecg/nodecg/issues/358)) ([74915d7](https://github.com/nodecg/nodecg/commit/74915d7))
- **config:** always create cfg dir if it does not exist ([49a9255](https://github.com/nodecg/nodecg/commit/49a9255))
- **package:** add "bin" prop to package.json ([0c8d0b6](https://github.com/nodecg/nodecg/commit/0c8d0b6))
- **package:** add nsp compliance ([1b0da9b](https://github.com/nodecg/nodecg/commit/1b0da9b))
- add support for zeit pkg builds ([#362](https://github.com/nodecg/nodecg/issues/362)) ([acb168c](https://github.com/nodecg/nodecg/commit/acb168c))

<a name="0.9.8"></a>

## [0.9.8](https://github.com/nodecg/nodecg/compare/v0.9.7...v0.9.8) (2017-10-19)

### Bug Fixes

- **bundle-manager:** don't attempt watch \*.lock files for changes ([269f3d0](https://github.com/nodecg/nodecg/commit/269f3d0))
- **package:** update JSDoc ([a1a81c5](https://github.com/nodecg/nodecg/commit/a1a81c5))
- **package:** update nyc ([13256a8](https://github.com/nodecg/nodecg/commit/13256a8))
- **replicants:** support schemas with internal \$refs ([ee1c394](https://github.com/nodecg/nodecg/commit/ee1c394))

<a name="0.9.7"></a>

## [0.9.7](https://github.com/nodecg/nodecg/compare/v0.9.6...v0.9.7) (2017-09-12)

### Bug Fixes

- **api:** detect and throw when an object is assigned to multiple Replicants ([2fbaee3](https://github.com/nodecg/nodecg/commit/2fbaee3))
- **dashboard:** remove extra margins that could appear in bundle dialogs ([7bb2f9f](https://github.com/nodecg/nodecg/commit/7bb2f9f))

<a name="0.9.6"></a>

## [0.9.6](https://github.com/nodecg/nodecg/compare/v0.9.5...v0.9.6) (2017-09-07)

### Bug Fixes

- remove debug print ([22e957b](https://github.com/nodecg/nodecg/commit/22e957b))
- **sentry:** fix git information not being updated during runtime ([1d34d4b](https://github.com/nodecg/nodecg/commit/1d34d4b))

<a name="0.9.5"></a>

## [0.9.5](https://github.com/nodecg/nodecg/compare/v0.9.4...v0.9.5) (2017-09-07)

### Bug Fixes

- **dashboard:** fix Sign Out button being visible when login security is disabled ([aa12c54](https://github.com/nodecg/nodecg/commit/aa12c54))

### Features

- **sentry:** include git information about all loaded bundles when reporting errors to sentry ([431274b](https://github.com/nodecg/nodecg/commit/431274b))

<a name="0.9.4"></a>

## [0.9.4](https://github.com/nodecg/nodecg/compare/v0.9.3...v0.9.4) (2017-08-31)

### Bug Fixes

- **config:** reduce the number of cases where a bundle's config is rejected when it shouldn't be ([e62de24](https://github.com/nodecg/nodecg/commit/e62de24))
- **replicants:** improve parsing of schema \$refs ([6364396](https://github.com/nodecg/nodecg/commit/6364396))

<a name="0.9.3"></a>

## [0.9.3](https://github.com/nodecg/nodecg/compare/v0.9.2...v0.9.3) (2017-08-29)

### Bug Fixes

- **config:** properly load baseURL param ([8c3d76b](https://github.com/nodecg/nodecg/commit/8c3d76b))

<a name="0.9.2"></a>

## [0.9.2](https://github.com/nodecg/nodecg/compare/v0.9.1...v0.9.2) (2017-08-28)

### Bug Fixes

- **package:** make fs.extra a production dependency, instead of a devDependency ([5ac2c88](https://github.com/nodecg/nodecg/commit/5ac2c88))

<a name="0.9.1"></a>

## [0.9.1](https://github.com/nodecg/nodecg/compare/v0.9.0...v0.9.1) (2017-08-28)

### Bug Fixes

- **bundle-manager:** fix case where changes to a bundle's manifest could get ignored ([882f406](https://github.com/nodecg/nodecg/commit/882f406))
- **bundle-manager:** remove debug print ([91546e2](https://github.com/nodecg/nodecg/commit/91546e2))
- **replicants:** improve how revision mismatch errors are logged to console on the client ([e99dcbc](https://github.com/nodecg/nodecg/commit/e99dcbc))
- **package:** fix version number in `package.json` (this prevented most bundles from loading - whoops!)

<a name="0.9.0"></a>

# [0.9.0](https://github.com/nodecg/nodecg/compare/v0.8.9...v0.9.0) (2017-08-27)

### Bug Fixes

- **api:** print more useful error message when a replicant fails schema validation due to having additional properties ([037709a](https://github.com/nodecg/nodecg/commit/037709a))
- **assets:** improve appearance of dialogs. refactor back and frontend code to allow for potential future features. ([7025d51](https://github.com/nodecg/nodecg/commit/7025d51)), closes [#309](https://github.com/nodecg/nodecg/issues/309)
- **config:** default `host` to `0.0.0.0` instead of `localhost` ([7a3276d](https://github.com/nodecg/nodecg/commit/7a3276d))
- **config:** default baseURL to `localhost` when host is `0.0.0.0` ([3a4496b](https://github.com/nodecg/nodecg/commit/3a4496b))
- **dashboard:** add `raised` attribute to KILL button on single-instance graphics ([1e116db](https://github.com/nodecg/nodecg/commit/1e116db))
- **dashboard:** close drawer when viewport increases to a wide layout ([20bafef](https://github.com/nodecg/nodecg/commit/20bafef)), closes [#282](https://github.com/nodecg/nodecg/issues/282)
- **replicants:** fixed a case where re-assigning a nested object could result in a broken replicant ([9e72b86](https://github.com/nodecg/nodecg/commit/9e72b86))
- **replicants:** harden logging of validation errors ([250b3fe](https://github.com/nodecg/nodecg/commit/250b3fe))
- **replicants:** prevent .once('change') listeners from potentially being called twice ([78a11c8](https://github.com/nodecg/nodecg/commit/78a11c8)), closes [#296](https://github.com/nodecg/nodecg/issues/296)
- **replicants:** properly load schemas when schemaPath is absolute ([4201906](https://github.com/nodecg/nodecg/commit/4201906))
- **replicants:** set status to "declared" _before_ emitting the post-declare change event ([a62d25d](https://github.com/nodecg/nodecg/commit/a62d25d))
- **soundCues:** fix case where valid soundCues could fail schema validation ([f0c17ba](https://github.com/nodecg/nodecg/commit/f0c17ba))

### Code Refactoring

- **dashboard:** port to Polymer 2 ([2084237](https://github.com/nodecg/nodecg/commit/2084237)), closes [#218](https://github.com/nodecg/nodecg/issues/218)
- The following modules have been merged back into the main NodeCG codebase, instead of being kept as separate packages:
  - [nodecg-bundle-parser](https://github.com/nodecg/nodecg-bundle-parser)
  - [@nodecg/bundle-manager](https://github.com/nodecg/bundle-manager)
  - [@nodecg/logger](https://github.com/nodecg/logger)

* **tests:** rewrote tests to use `ava` instead of `mocha`

### Features

- **api:** add nodecg.unlisten method ([ea45b3f](https://github.com/nodecg/nodecg/commit/ea45b3f))
- **api:** expose Logger class ([5882dc4](https://github.com/nodecg/nodecg/commit/5882dc4))
- **api:** if an acknowledgement is called with an error as the first callback, serialize that error ([#300](https://github.com/nodecg/nodecg/issues/300)) ([1c05f81](https://github.com/nodecg/nodecg/commit/1c05f81))
- **api:** make client-side sendMessage return a Promise ([#301](https://github.com/nodecg/nodecg/issues/301)) ([fe93c73](https://github.com/nodecg/nodecg/commit/fe93c73)), closes [#297](https://github.com/nodecg/nodecg/issues/297)
- **config:** add support for whitelisted loading of bundles ([31533a8](https://github.com/nodecg/nodecg/commit/31533a8))
- **config:** added `--bundlesEnabled` and `--bundlesDisabled` command-line arguments to specify a comma-separated list of bundle names to either whitelist or blacklist for loading on startup. Very useful when combined with things such as Run Configurations in your IDE of choosing.
- **dashboard:** add "open in standalone window" button to panel headers ([ba077c0](https://github.com/nodecg/nodecg/commit/ba077c0))
- **dashboard:** add default body background color style to panels ([3433529](https://github.com/nodecg/nodecg/commit/3433529))
- **dashboard:** add support for "fullbleed" workspaces, which have one single panel that takes up the entire dashboard
- **dashboard:** add support for multiple tabs of panels, called "workspaces". See the [Manifest tutorial](https://nodecg.dev/tutorial-manifest.html) (specifically the `nodecg.dashboardPanels` section) for more info.
- **dashboard:** compatability with browsers other than Chrome has been greatly improved
- **dashboard:** re-design dashboard with tabbed navigation ([8214b43](https://github.com/nodecg/nodecg/commit/8214b43))
- **dashboard:** show a much shorter and easier to read URL for each graphic on the Graphics page ([5b91af1](https://github.com/nodecg/nodecg/commit/5b91af1))
- **replicants:** add .validationErrors property ([59f3c82](https://github.com/nodecg/nodecg/commit/59f3c82))
- **replicants:** log a warning when attempting to access .value before the Replicant has finished declaring ([#274](https://github.com/nodecg/nodecg/issues/274)) ([293acf5](https://github.com/nodecg/nodecg/commit/293acf5)), closes [#265](https://github.com/nodecg/nodecg/issues/265)
- **replicants:** support external $refs in schemas ([3c34450](https://github.com/nodecg/nodecg/commit/3c34450))
- add convenience 'shared' directory ([#295](https://github.com/nodecg/nodecg/issues/295)) ([63a1119](https://github.com/nodecg/nodecg/commit/63a1119))
- add Sentry integration for error tracking ([#305](https://github.com/nodecg/nodecg/issues/305)) ([92cd540](https://github.com/nodecg/nodecg/commit/92cd540))
- adopt new routing style (/bundles/:bundleName/\*) ([1663670](https://github.com/nodecg/nodecg/commit/1663670))
- log unhandled promise rejections if Sentry is not enabled ([59dc75e](https://github.com/nodecg/nodecg/commit/59dc75e))

* **api:** add nodecg.unlisten method ([ea45b3f](https://github.com/nodecg/nodecg/commit/ea45b3f))
* **api:** expose Logger class ([5882dc4](https://github.com/nodecg/nodecg/commit/5882dc4))
* **api:** if an acknowledgement is called with an error as the first callback, serialize that error ([#300](https://github.com/nodecg/nodecg/issues/300)) ([1c05f81](https://github.com/nodecg/nodecg/commit/1c05f81))
* **api:** make client-side sendMessage return a Promise ([#301](https://github.com/nodecg/nodecg/issues/301)) ([fe93c73](https://github.com/nodecg/nodecg/commit/fe93c73)), closes [#297](https://github.com/nodecg/nodecg/issues/297)
* **config:** add support for whitelisted loading of bundles ([31533a8](https://github.com/nodecg/nodecg/commit/31533a8))
* **config:** added `--bundlesEnabled` and `--bundlesDisabled` command-line arguments to specify a comma-separated list of bundle names to either whitelist or blacklist for loading on startup. Very useful when combined with things such as Run Configurations in your IDE of choosing.
* **dashboard:** add "open in standalone window" button to panel headers ([ba077c0](https://github.com/nodecg/nodecg/commit/ba077c0))
* **dashboard:** add default body background color style to panels ([3433529](https://github.com/nodecg/nodecg/commit/3433529))
* **dashboard:** add support for "fullbleed" workspaces, which have one single panel that takes up the entire dashboard
* **dashboard:** add support for multiple tabs of panels, called "workspaces". See the [Manifest tutorial](https://nodecg.dev/tutorial-manifest.html) (specifically the `nodecg.dashboardPanels` section) for more info.
* **dashboard:** compatability with browsers other than Chrome has been greatly improved
* **dashboard:** re-design dashboard with tabbed navigation ([8214b43](https://github.com/nodecg/nodecg/commit/8214b43))
* **dashboard:** show a much shorter and easier to read URL for each graphic on the Graphics page ([5b91af1](https://github.com/nodecg/nodecg/commit/5b91af1))
* **replicants:** add .validationErrors property ([59f3c82](https://github.com/nodecg/nodecg/commit/59f3c82))
* **replicants:** log a warning when attempting to access .value before the Replicant has finished declaring ([#274](https://github.com/nodecg/nodecg/issues/274)) ([293acf5](https://github.com/nodecg/nodecg/commit/293acf5)), closes [#265](https://github.com/nodecg/nodecg/issues/265)
* **replicants:** support external \$refs in schemas ([3c34450](https://github.com/nodecg/nodecg/commit/3c34450))
* add convenience 'shared' directory ([#295](https://github.com/nodecg/nodecg/issues/295)) ([63a1119](https://github.com/nodecg/nodecg/commit/63a1119))
* add Sentry integration for error tracking ([#305](https://github.com/nodecg/nodecg/issues/305)) ([92cd540](https://github.com/nodecg/nodecg/commit/92cd540))
* adopt new routing style (/bundles/:bundleName/\*) ([1663670](https://github.com/nodecg/nodecg/commit/1663670))
* log unhandled promise rejections if Sentry is not enabled ([59dc75e](https://github.com/nodecg/nodecg/commit/59dc75e))

### Performance Improvements

- implement polymer-build ([#286](https://github.com/nodecg/nodecg/issues/286)) ([cad6a42](https://github.com/nodecg/nodecg/commit/cad6a42))

### BREAKING CHANGES

For detailed instructions on how to migrate your v0.8 bundles to v0.9, [check out the tutorial on NodeCG.dev](https://nodecg.dev/tutorial-migrating-0.8-to-0.9.html)

- NodeCG no longer automatically installs the `npm` and `bower` dependencies of installed bundles. Users must do this manually.
- replicants: Replicants now set their state to `declared` _before_ they emit their post-declare `change` event. This is unlikely to break any existing code, but it is technically a breaking change.
- The Rollbar integration for error tracking has been removed, and has been replaced with a [Sentry](https://sentry.io/welcome/) integration.
- api: If the first argument you provide to a message acknowledgement is an Error, it will be serialized instead of being sent as an empty object.
- dashboard: Removed most of the helper styles and classes, such as `nodecg-configure`, which were being injected into panels. Most of it would not work in Polymer 2 without extra effort.
- Old `/panel` and `/graphics` routes no longer work. You must update all routes to the new `/bundles/:bundleName/*` format.

<a name="0.8.9"></a>

## [0.8.9](https://github.com/nodecg/nodecg/compare/v0.8.8...v0.8.9) (2017-03-08)

### Bug Fixes

- **login:** fix case where an invalid `socketToken` cookie would prevent a user from ever being able to log in ([7392249](https://github.com/nodecg/nodecg/commit/7392249))

<a name="0.8.8"></a>

## [0.8.8](https://github.com/nodecg/nodecg/compare/v0.8.7...v0.8.8) (2017-03-03)

### Bug Fixes

- **auth:** fix case where token auth via cookies would fail when `host` was set to `0.0.0.0` ([#255](https://github.com/nodecg/nodecg/issues/255)) ([cb89d25](https://github.com/nodecg/nodecg/commit/cb89d25))
- **sounds:** persist the soundCues replicant to disk ([#258](https://github.com/nodecg/nodecg/issues/258)) ([775c158](https://github.com/nodecg/nodecg/commit/775c158))

### Features

- add `NODECG_ROOT` environment variable ([#257](https://github.com/nodecg/nodecg/issues/257)) ([ec0fcb1](https://github.com/nodecg/nodecg/commit/ec0fcb1))

<a name="0.8.7"></a>

## [0.8.7](https://github.com/nodecg/nodecg/compare/v0.8.6...v0.8.7) (2017-03-02)

### Bug Fixes

- **api:** throw an error instead of just logging a warning when adding a duplicate `listenFor` handler ([187b601](https://github.com/nodecg/nodecg/commit/187b601))
- **dashboard:** fix panels all being moved to top left corner when window is resized while a non-Dashboard tab is selected ([89812f4](https://github.com/nodecg/nodecg/commit/89812f4)), closes [#217](https://github.com/nodecg/nodecg/issues/217)
- ensure NodeCG binds to the host and port provided in `cfg/nodecg.json` (thanks @vibhavp!) ([fa5b57e](https://github.com/nodecg/nodecg/commit/fa5b57e))

### Features

- **sound:** add support for user-defined sound cues ([#254](https://github.com/nodecg/nodecg/issues/254)) ([05878eb](https://github.com/nodecg/nodecg/commit/05878eb))
  - This is an advanced and currently undocumented feature. It requires much additional code within a bundle to be useful. We do not recommend trying to use it at this time.

<a name="0.8.6"></a>

## [0.8.6](https://github.com/nodecg/nodecg/compare/v0.8.5...v0.8.6) (2017-01-29)

### Bug Fixes

- **api:** call encodeURIComponent on "namespace" and "name" when autogenerating schemaPath ([0fd2a19](https://github.com/nodecg/nodecg/commit/0fd2a19))
- **assets:** avoid thrashing asset replicants on startup ([1250dd4](https://github.com/nodecg/nodecg/commit/1250dd4))
- **dashboard:** fix `dialog-dismiss` and `dialog-confirm` buttons sometimes not working ([5f06166](https://github.com/nodecg/nodecg/commit/5f06166))
- **replicant:** fix potential case where a proxied Array with custom methods wouldn't behave as expected ([d772f05](https://github.com/nodecg/nodecg/commit/d772f05))
- **replicants:** fix case where Replicants with a value of `undefined` would not emit `change` events after declaration ([a218dbe](https://github.com/nodecg/nodecg/commit/a218dbe)), closes [#228](https://github.com/nodecg/nodecg/issues/228)
- fix favicon not being served ([3dcdc83](https://github.com/nodecg/nodecg/commit/3dcdc83))
- **rollbar:** add reporting of unhandled promise rejections ([c1a33b4](https://github.com/nodecg/nodecg/commit/c1a33b4))
- **rollbar:** fix browser-side Rollbar not receiving the correct access token from the config ([2b810fd](https://github.com/nodecg/nodecg/commit/2b810fd))
- **single_instance:** fix "Kill" buttons always being visible, even if no instance was open ([6f4bc77](https://github.com/nodecg/nodecg/commit/6f4bc77))

### Features

- add ability to disable bundles via config ([#248](https://github.com/nodecg/nodecg/issues/248)) ([58480bd](https://github.com/nodecg/nodecg/commit/58480bd))
- **auth:** secure `/graphics` routes ([#249](https://github.com/nodecg/nodecg/issues/249)) ([975c17f](https://github.com/nodecg/nodecg/commit/975c17f))
- **config:** add "exitOnUncaught" config param ([a77bccf](https://github.com/nodecg/nodecg/commit/a77bccf))
- **rollbar:** automatically report errors logged with `nodecg.log.error` to Rollbar, if Rollbar is enabled ([7b19eaa](https://github.com/nodecg/nodecg/commit/7b19eaa))

<a name="0.8.5"></a>

## [0.8.5](https://github.com/nodecg/nodecg/compare/v0.8.4...v0.8.5) (2016-10-12)

### Bug Fixes

- **dashboard:** fix "copy url" button sometimes wrapping to two lines and looking bad ([6047a52](https://github.com/nodecg/nodecg/commit/6047a52))
- **dashboard:** hide "Settings" menu button if there are no settings to manage in the current configuration ([4f304eb](https://github.com/nodecg/nodecg/commit/4f304eb))
- **replicants:** fix case where an unproxied object could be leaked via the `change` event after reconnecting to Socket.IO ([9e39d45](https://github.com/nodecg/nodecg/commit/9e39d45))

### Features

- **replicants:** add `result` property to operations ([5f6e86f](https://github.com/nodecg/nodecg/commit/5f6e86f))
- **replicants:** provide better error messages when a replicant fails schema validation ([daddf64](https://github.com/nodecg/nodecg/commit/daddf64))
- **sounds:** add optional `channels` param ([f33a165](https://github.com/nodecg/nodecg/commit/f33a165))

<a name="0.8.4"></a>

## [0.8.4](https://github.com/nodecg/nodecg/compare/v0.8.3...v0.8.4) (2016-09-29)

### Bug Fixes

- **dashboard:** replace usage of cn-jsurl bower lib with new URLSearchParams API ([ea39f50](https://github.com/nodecg/nodecg/commit/ea39f50))
- **docker:** remove VOLUME statement for db folder ([2b8ecfe](https://github.com/nodecg/nodecg/commit/2b8ecfe))
- **server:** catch and re-throw otherwise uncaught socket.io errors ([1fc9a18](https://github.com/nodecg/nodecg/commit/1fc9a18))
- **server:** fix debug message logging string as number ([eac7f63](https://github.com/nodecg/nodecg/commit/eac7f63))
- **server:** improve rollbar catching of socket.io errors ([e8a3443](https://github.com/nodecg/nodecg/commit/e8a3443))
- **sounds:** fix error when soundFiles is null during option generation for Mixer panel ([19226b2](https://github.com/nodecg/nodecg/commit/19226b2))
- **sounds:** fixed sounds category not showing in assets when there are no other asset categories defined. ([#220](https://github.com/nodecg/nodecg/issues/220)) ([b744fda](https://github.com/nodecg/nodecg/commit/b744fda)), closes [#208](https://github.com/nodecg/nodecg/issues/208)

### Features

- **replicants:** add optional validation of replicant values via schemas ([26715fc](https://github.com/nodecg/nodecg/commit/26715fc))

<a name="0.8.3"></a>

## [0.8.3](https://github.com/nodecg/nodecg/compare/v0.8.2...v0.8.3) (2016-06-23)

### Bug Fixes

- **docker:** use abs path for db volume ([8480a58](https://github.com/nodecg/nodecg/commit/8480a58))
- **replicants:** fixed unexpected behavior after modifying the index of an object inside an array replicant ([2127dc4](https://github.com/nodecg/nodecg/commit/2127dc4))

### Features

- **login:** add `forceHttpsReturn` config param ([d952c95](https://github.com/nodecg/nodecg/commit/d952c95))

<a name="0.8.2"></a>

## [0.8.2](https://github.com/nodecg/nodecg/compare/v0.8.1...v0.8.2) (2016-06-11)

### Bug Fixes

- pages now autodetect what URL/port to open a socket to ([7eb1a3e](https://github.com/nodecg/nodecg/commit/7eb1a3e)), closes [#125](https://github.com/nodecg/nodecg/issues/125)

<a name="0.8.1"></a>

## [0.8.1](https://github.com/nodecg/nodecg/compare/v0.8.0...v0.8.1) (2016-06-10)

### Bug Fixes

- **dashboard:** update nodecg-replicants ([c537e36](https://github.com/nodecg/nodecg/commit/c537e36))
- **replicants:** ensure that already proxied objects aren't re-proxied ([93f5539](https://github.com/nodecg/nodecg/commit/93f5539))
- **replicants:** fix case where an unproxied object could sometimes be returned ([b1dc39b](https://github.com/nodecg/nodecg/commit/b1dc39b))
- **replicants:** fix client-side assignment being processed twice ([e52b7cb](https://github.com/nodecg/nodecg/commit/e52b7cb))
- **replicants:** fix detection of changes in late-assigned objects ([053605f](https://github.com/nodecg/nodecg/commit/053605f)), closes [#181](https://github.com/nodecg/nodecg/issues/181)
- **replicants:** fix objects inserted into arrays via array insertion methods not being proxied ([4e2d941](https://github.com/nodecg/nodecg/commit/4e2d941))
- **server:** update Node.js v6 check from 'warn and continue' to 'error and exit' on lower versions ([2fdb534](https://github.com/nodecg/nodecg/commit/2fdb534))
- update nodecg-replicant to 0.5.8 ([29323b0](https://github.com/nodecg/nodecg/commit/29323b0))

### Features

- **dialogs:** improve responsiveness of dialogs ([204c8aa](https://github.com/nodecg/nodecg/commit/204c8aa))
- **dialogs:** only add h2 title if panel.title has length ([0696088](https://github.com/nodecg/nodecg/commit/0696088))

<a name="0.8.0"></a>

# [0.8.0](https://github.com/nodecg/nodecg/compare/v0.7.7...v0.8.0) (2016-05-06)

### Bug Fixes

- **api:** throw error when handler is not a function ([9804a84](https://github.com/nodecg/nodecg/commit/9804a84))
- **dashboard:** fix "Copy Url" buttons on graphics page ([3ed107f](https://github.com/nodecg/nodecg/commit/3ed107f))
- **dashboard:** fix invalid javascript on standalone panels ([fcba09b](https://github.com/nodecg/nodecg/commit/fcba09b))
- **panels:** panels are now served by filename rather than panel name ([9f3e54b](https://github.com/nodecg/nodecg/commit/9f3e54b)), closes [#144](https://github.com/nodecg/nodecg/issues/144)
- **rollbar:** check for `config.rollbar.enabled` before activating rollbar ([cffb1a3](https://github.com/nodecg/nodecg/commit/cffb1a3))
- **sounds:** throw more informative errors when attempting to use sound api methods with no soundCues ([e159749](https://github.com/nodecg/nodecg/commit/e159749))
- **tests:** fix typo in error message ([a6a0f99](https://github.com/nodecg/nodecg/commit/a6a0f99))
- **tests:** test standalone panels, ensure autodeps are enabled ([366422d](https://github.com/nodecg/nodecg/commit/366422d))

### Code Refactoring

- **replicants:** use Proxy instead of Object.observe ([#163](https://github.com/nodecg/nodecg/issues/163)) ([05ec891](https://github.com/nodecg/nodecg/commit/05ec891))

### Features

- **rollbar:** add support for automatically reporting uncaught exceptions to Rollbar ([80f0ea6](https://github.com/nodecg/nodecg/commit/80f0ea6))
- **sounds:** add sounds feature, rename uploads to assets, add categories to assets ([52a9045](https://github.com/nodecg/nodecg/commit/52a9045))

### BREAKING CHANGES

- replicants: The order of Replicant `change` event arguments has been swapped. `newVal` is now the first argument, `oldVal` is the second argument. Be sure to update all of your `change` event handlers accordingly.

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

- replicants: The third Replicant `change` event argument has been changed. Previously it was `changes`, an array of Object.observe change records. It is now `operations`, an array of operation records in NodeCG's internal format. This format is likely to continue changing as we figure out what works best. Any further changes to this format will be considered breaking.
- replicants: WeakMap and Object.observe shims have been removed. This probably won't affect anyone, as any browser that supports Proxy also supports WeakMap, but be aware of it.
- panels: the routes for panels are now `/panel/:bundleName/:panelFile` as opposed to `/panel/:bundleName/:panelName`.
- sounds: uploads are now called assets, and their manifest format has changed

<a name="0.7.7"></a>

## [0.7.7](https://github.com/nodecg/nodecg/compare/v0.7.6...v0.7.7) (2016-03-31)

### Bug Fixes

- **api:** fix API erroring on page load ([fec7793](https://github.com/nodecg/nodecg/commit/fec7793))

<a name="0.7.6"></a>

## [0.7.6](https://github.com/nodecg/nodecg/compare/v0.7.5...v0.7.6) (2016-03-31)

### Bug Fixes

- **dashboard:** fix "copy key" button on settings page ([9182534](https://github.com/nodecg/nodecg/commit/9182534))
- **dashboard:** fix panels appearing over the top of the loading spinner ([6529248](https://github.com/nodecg/nodecg/commit/6529248))
- **deps:** bump [@nodecg](https://github.com/nodecg)/bundle-manager dep, forgot to in last release ([4580bd2](https://github.com/nodecg/nodecg/commit/4580bd2))
- **login:** improve reliability of login lib ([4e37a13](https://github.com/nodecg/nodecg/commit/4e37a13))
- **tests:** remove reference to wrench ([a9ea8d9](https://github.com/nodecg/nodecg/commit/a9ea8d9))

### Features

- **all:** update socket.io to 1.4.5, improves performance. ([59d12c2](https://github.com/nodecg/nodecg/commit/59d12c2))
- **dashboard:** add loading spinner to panels ([dbc0466](https://github.com/nodecg/nodecg/commit/dbc0466))
- **dashboard:** close the drawer panel when selecting an item ([decc77f](https://github.com/nodecg/nodecg/commit/decc77f))
- **dashboard:** emit `dialog-opened` event in a dialog's `document` when it opens ([bb527eb](https://github.com/nodecg/nodecg/commit/bb527eb))
- **dashboard:** show resolution on graphics page ([8ab9335](https://github.com/nodecg/nodecg/commit/8ab9335))

<a name="0.7.5"></a>

## [0.7.5](https://github.com/nodecg/nodecg/compare/v0.7.4...v0.7.5) (2016-03-13)

### Bug Fixes

- **dashboard:** don't apply background color to disabled paper-button elements when using builtin nodecg style classes ([a34fc9d](https://github.com/nodecg/nodecg/commit/a34fc9d))

### Features

- **api:** deprecate nearestElementWithAttribute, replace usage with element.closest() ([45b272c](https://github.com/nodecg/nodecg/commit/45b272c)), closes [#141](https://github.com/nodecg/nodecg/issues/141)
- **bundles:** Add configuration values allowing to disable bundle autodeps ([4a99774](https://github.com/nodecg/nodecg/commit/4a99774))
- **caching:** disable caching ([a70b9be](https://github.com/nodecg/nodecg/commit/a70b9be))
- **npm:** only install production dependencies for bundles ([be0e74c](https://github.com/nodecg/nodecg/commit/be0e74c))

<a name="0.7.4"></a>

## [0.7.4](https://github.com/nodecg/nodecg/compare/v0.7.3...v0.7.4) (2016-03-01)

### Bug Fixes

- **api:** fix trace logging for client-side message reception ([dc71366](https://github.com/nodecg/nodecg/commit/dc71366))
- **dashboard:** assign a more unique ID to the main paper-toast element ([00f5959](https://github.com/nodecg/nodecg/commit/00f5959))
- **dashboard:** remove default opacity style of disabled paper-button elements ([d6e5baa](https://github.com/nodecg/nodecg/commit/d6e5baa))
- **uploads:** fix case where changes to the first file caused duplication ([4e7a61f](https://github.com/nodecg/nodecg/commit/4e7a61f))

### Features

- **bundleConfig:** defaults from configschema.json are now automatically applied to nodecg.bundleConfig ([a4e28fa](https://github.com/nodecg/nodecg/commit/a4e28fa))
- **uploads:** bundles can specify allowed file types via uploads.allowedTypes ([7a1a775](https://github.com/nodecg/nodecg/commit/7a1a775))
- **uploads:** debounce change events by 500ms ([91d151c](https://github.com/nodecg/nodecg/commit/91d151c))

<a name="0.7.3"></a>

## [0.7.3](https://github.com/nodecg/nodecg/compare/v0.7.2...v0.7.3) (2016-02-20)

### Bug Fixes

- **uploads:** prevent crash related to uninstalled bundles ([9d17dc3](https://github.com/nodecg/nodecg/commit/9d17dc3))

### Features

- **dashboard:** hide panel controls until mouseover ([7855a0b](https://github.com/nodecg/nodecg/commit/7855a0b))

<a name="0.7.2"></a>

## [0.7.2](https://github.com/nodecg/nodecg/compare/v0.7.1...v0.7.2) (2016-02-17)

### Bug Fixes

- **dashboard:** fix loading of builtin polymer element scripts ([52cc0fc](https://github.com/nodecg/nodecg/commit/52cc0fc))
- **dashboard:** remove unintentionally added "uploads" page ([e2eb80b](https://github.com/nodecg/nodecg/commit/e2eb80b))
- **scripts:** Remove trailing comma from package.json ([6304457](https://github.com/nodecg/nodecg/commit/6304457))
- **tests:** Have Travis install grunt before running tests ([d49091a](https://github.com/nodecg/nodecg/commit/d49091a))

### Features

- **uploads:** add file upload system ([e109edf](https://github.com/nodecg/nodecg/commit/e109edf)), closes [#104](https://github.com/nodecg/nodecg/issues/104)

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
