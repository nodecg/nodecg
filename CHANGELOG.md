# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [10.11.13](https://github.com/Hoishin/nodecg-release-test/compare/v10.11.12...v10.11.13) (2025-11-02)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @nodecg-release-test/cli bumped from 12.11.10 to 12.12.0

## [2.6.1](https://github.com/nodecg/nodecg/compare/nodecg-v2.6.0...nodecg-v2.6.1) (2025-06-24)


### Bug Fixes

* **deps:** remove GPLv3 packages ([#858](https://github.com/nodecg/nodecg/issues/858)) ([7c26304](https://github.com/nodecg/nodecg/commit/7c26304bc9e63474ce867755a0d2073a21483d17))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @nodecg/cli bumped from 2.6.0 to 2.6.1
    * @nodecg/database-adapter-sqlite-legacy bumped from 2.6.0 to 2.6.1
    * @nodecg/database-adapter-types bumped from 2.6.0 to 2.6.1
    * @nodecg/internal-util bumped from 2.6.0 to 2.6.1

## [2.6.0](https://github.com/nodecg/nodecg/compare/nodecg-v2.5.3...nodecg-v2.6.0) (2025-06-20)


### Features

* move CLI to own package ([#827](https://github.com/nodecg/nodecg/issues/827)) ([517e7d0](https://github.com/nodecg/nodecg/commit/517e7d0f4dcea97cd681a07813a254f7c204d37a))
* move default database adapter to own package ([#821](https://github.com/nodecg/nodecg/issues/821)) ([2527f15](https://github.com/nodecg/nodecg/commit/2527f151737971a9dbde5f686f97edf48c48735b))
* separate database adapter types into own package ([#814](https://github.com/nodecg/nodecg/issues/814)) ([a8ebaed](https://github.com/nodecg/nodecg/commit/a8ebaed56a7c0ef953d0f079acca38408b36cad4))


### Bug Fixes

* **ci:** restructure publish jobs for canary releases and standard releases ([b595ac0](https://github.com/nodecg/nodecg/commit/b595ac0a9297c0e72d621309088a8e8ae9cde112))
* **deps:** bump better-sqlite3 and typeorm ([#850](https://github.com/nodecg/nodecg/issues/850)) ([926c2cc](https://github.com/nodecg/nodecg/commit/926c2cc0ca94e6df6437ad0323ad0b226e6f79ca))
* ensure 'include-component-in-tag' is set to false in release-please config ([f95e984](https://github.com/nodecg/nodecg/commit/f95e98456e22653db893dad05aaf676d991ced28))
* **release:** combine release with "component" ([#851](https://github.com/nodecg/nodecg/issues/851)) ([305c257](https://github.com/nodecg/nodecg/commit/305c257549556378e36e4526a2561cad6af21686))
* **release:** update component references for workspaces to use 'nodecg' ([e927a73](https://github.com/nodecg/nodecg/commit/e927a730cc8f57091b17f7dd0317b69e9114c014))
* **release:** use component names ([#855](https://github.com/nodecg/nodecg/issues/855)) ([3f31d23](https://github.com/nodecg/nodecg/commit/3f31d2304d1a47b8c7103b6d88887162b56c9cd4))
* **release:** use linked-versions ([#854](https://github.com/nodecg/nodecg/issues/854)) ([fdd6bd8](https://github.com/nodecg/nodecg/commit/fdd6bd816125a64a759d2a34e07f436a928f7f96))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @nodecg/cli bumped from 0.0.0 to 2.6.0
    * @nodecg/database-adapter-sqlite-legacy bumped from 0.0.0 to 2.6.0
    * @nodecg/database-adapter-types bumped from 0.0.0 to 2.6.0
    * @nodecg/internal-util bumped from 0.0.0 to 2.6.0

## [2.5.3](https://github.com/nodecg/nodecg/compare/v2.5.2...v2.5.3) (2025-01-20)


### Bug Fixes

* **cli:** use npm to list available NodeCG versions ([#810](https://github.com/nodecg/nodecg/issues/810)) ([fcb6e2b](https://github.com/nodecg/nodecg/commit/fcb6e2b46fc584c09e7cf27cd07c7814c44c675d))

## [2.5.2](https://github.com/nodecg/nodecg/compare/v2.5.1...v2.5.2) (2025-01-20)


### Bug Fixes

* **cli:** start command import path on windows ([#805](https://github.com/nodecg/nodecg/issues/805)) ([bf6aed0](https://github.com/nodecg/nodecg/commit/bf6aed0f8520ca7916466684b34e641b512c526c))
* **server-replicant:** error handling for unexpected files in bundles ([#808](https://github.com/nodecg/nodecg/issues/808)) ([34a374b](https://github.com/nodecg/nodecg/commit/34a374b384c3639204c775b504d0f27c57f58128))

## [2.5.1](https://github.com/nodecg/nodecg/compare/v2.5.0...v2.5.1) (2025-01-19)


### Bug Fixes

* publish linux arm image and enable coverage  ([#800](https://github.com/nodecg/nodecg/issues/800)) ([b6a5550](https://github.com/nodecg/nodecg/commit/b6a5550e390bd582e114f1e7966583a7a4033ff2))

## [2.5.0](https://github.com/nodecg/nodecg/compare/v2.4.3...v2.5.0) (2025-01-18)


### Features

* allow installing nodecg as dependency ([#796](https://github.com/nodecg/nodecg/issues/796)) ([b8afbf7](https://github.com/nodecg/nodecg/commit/b8afbf778ce32fd44a309039edb779cefe367e9a))
* **docker:** support linux arm ([#797](https://github.com/nodecg/nodecg/issues/797)) ([fdcc10b](https://github.com/nodecg/nodecg/commit/fdcc10bd6c706e85b6156558236396f6a8f9b79e))
* update chokidar to v4 ([#799](https://github.com/nodecg/nodecg/issues/799)) ([817d8b1](https://github.com/nodecg/nodecg/commit/817d8b116d7191344b2b629ebba7e1db45ebefe1))

## [2.4.3](https://github.com/nodecg/nodecg/compare/v2.4.2...v2.4.3) (2025-01-06)


### Bug Fixes

* **cli:** use ESM runtime ([#794](https://github.com/nodecg/nodecg/issues/794)) ([c084c3c](https://github.com/nodecg/nodecg/commit/c084c3c5ce6c6e859dde0b3139d4dccb02b61d4b))

## [2.4.2](https://github.com/nodecg/nodecg/compare/v2.4.1...v2.4.2) (2025-01-06)


### Bug Fixes

* **deps:** use npm-run-all2 and fix chalk reference ([#789](https://github.com/nodecg/nodecg/issues/789)) ([df0f314](https://github.com/nodecg/nodecg/commit/df0f314f1ea1469ce82c57e0355717f2a308ca15))
* **docker:** remove bundles and cfg from VOLUME ([#791](https://github.com/nodecg/nodecg/issues/791)) ([ae71cc5](https://github.com/nodecg/nodecg/commit/ae71cc531ae73c6ee951a18b9ad3db9a462035fd))

## [2.4.1](https://github.com/nodecg/nodecg/compare/v2.4.0...v2.4.1) (2025-01-05)


### Bug Fixes

* clean up `nodecg-cli` ([#783](https://github.com/nodecg/nodecg/issues/783)) ([91191e5](https://github.com/nodecg/nodecg/commit/91191e52437afecf747179b7338f23e5d91ead0f))
* **cli:** npm install on windows ([#786](https://github.com/nodecg/nodecg/issues/786)) ([3ac4490](https://github.com/nodecg/nodecg/commit/3ac44900fc7a23739ca28996c48c67d3a824d56b))

## [2.4.0](https://github.com/nodecg/nodecg/compare/v2.3.2...v2.4.0) (2025-01-02)


### Features

* database adapter system ([#763](https://github.com/nodecg/nodecg/issues/763)) ([866aa55](https://github.com/nodecg/nodecg/commit/866aa55f43cc858fac75ed260461c838a8aff0c6))
* include CLI, deprecating `nodecg-cli` in favour of `nodecg` ([#779](https://github.com/nodecg/nodecg/issues/779)) ([7f50ba5](https://github.com/nodecg/nodecg/commit/7f50ba546cbbe899612d4c43dc7888b992e7981b))

## [2.3.2](https://github.com/nodecg/nodecg/compare/v2.3.1...v2.3.2) (2024-12-22)


### Bug Fixes

* reconnect socket in standalone dashboard ([#769](https://github.com/nodecg/nodecg/issues/769)) ([d171e87](https://github.com/nodecg/nodecg/commit/d171e87642485ef6f3cf0989e54b90362ae69c86))

## [2.3.1](https://github.com/nodecg/nodecg/compare/v2.3.0...v2.3.1) (2024-12-22)


### Bug Fixes

* remove node-fetch ([38da784](https://github.com/nodecg/nodecg/commit/38da7842ad7d46df7c6d9505a14d16f998ecc931))
* security updates for dependencies ([#766](https://github.com/nodecg/nodecg/issues/766)) ([c62337d](https://github.com/nodecg/nodecg/commit/c62337d76dc21a9d6df15ff527443a96998d625b))

## [2.3.0](https://github.com/nodecg/nodecg/compare/v2.2.5...v2.3.0) (2024-12-21)


### Features

* support nodejs v22 ([#760](https://github.com/nodecg/nodecg/issues/760)) ([b2db7e7](https://github.com/nodecg/nodecg/commit/b2db7e75ebda20bd9e7ca85af9b40735135c27c5))
* use node 22 for docker image ([e8ff043](https://github.com/nodecg/nodecg/commit/e8ff043b555d744b0b35bf927d05f44e5524f119))


### Bug Fixes

* remove Node 16 from supported runtime ([5838cdc](https://github.com/nodecg/nodecg/commit/5838cdc03f837acb8f1e60fd08b4bf38165b9c44))
* update better-sqlite3 ([8788701](https://github.com/nodecg/nodecg/commit/878870105b7128b38bc797be04c6a854fa88ad36))


### Reverts

* update of typeorm ([ad54cb4](https://github.com/nodecg/nodecg/commit/ad54cb4ba4d543ab93d8553b4f8d7c033aa08b70))

## [2.2.5](https://github.com/nodecg/nodecg/compare/v2.2.4...v2.2.5) (2024-11-30)


### Bug Fixes

* bugs preventing replicants in workers ([#756](https://github.com/nodecg/nodecg/issues/756)) ([824f9a9](https://github.com/nodecg/nodecg/commit/824f9a90bb054c0ff833838d457506e44035ddcf))

## [2.2.4](https://github.com/nodecg/nodecg/compare/v2.2.3...v2.2.4) (2024-10-12)


### Bug Fixes

* **types-release:** force update package.json version ([5db1c3a](https://github.com/nodecg/nodecg/commit/5db1c3a59c39f03bd9a38981f9dd0e0caab638e5))

## [2.2.3](https://github.com/nodecg/nodecg/compare/v2.2.2...v2.2.3) (2024-10-10)


### Bug Fixes

* Add '@types/ws' package to fix types package build ([#751](https://github.com/nodecg/nodecg/issues/751)) ([0c71ddd](https://github.com/nodecg/nodecg/commit/0c71dddfe7fe6fe1c8c632cce89272f0428cef86))
* Set cheerio version to avoid getting breaking changes in 1.0 release ([e069c96](https://github.com/nodecg/nodecg/commit/e069c968b41ae12700b49bdd37e66618f7b906e1))

## [2.2.2](https://github.com/nodecg/nodecg/compare/v2.2.1...v2.2.2) (2024-06-29)


### Bug Fixes

* **dashboard:** iframe lazy loading ([#729](https://github.com/nodecg/nodecg/issues/729)) ([a3dc36c](https://github.com/nodecg/nodecg/commit/a3dc36cec573ced0c82f25e6159a6067bf8ff1a4))
* ensure assignable sounds are set correctly ([#736](https://github.com/nodecg/nodecg/issues/736)) ([42d41a6](https://github.com/nodecg/nodecg/commit/42d41a6355c23dd2eea035c8594ed90eec20aae9))
* ensure sounds work on dashboard panels ([#735](https://github.com/nodecg/nodecg/issues/735)) ([f9d346b](https://github.com/nodecg/nodecg/commit/f9d346b3c506d8a0b805c330e050c727c2c13b34))
* **types:** target ES2015 in generated typings ([#732](https://github.com/nodecg/nodecg/issues/732)) ([fa977b3](https://github.com/nodecg/nodecg/commit/fa977b387e56a49375afb159e356ee64af61f0f9))

## [2.2.1](https://github.com/nodecg/nodecg/compare/v2.2.0...v2.2.1) (2024-01-14)


### Bug Fixes

* **login:** use correct logic for redirect URL protocol ([50551b2](https://github.com/nodecg/nodecg/commit/50551b29e1a6c5cb3a7888e65f29661f01317a6d))

## [2.2.0](https://github.com/nodecg/nodecg/compare/v2.1.12...v2.2.0) (2024-01-05)


### Features

* **deps:** update dependencies ([eaf0d07](https://github.com/nodecg/nodecg/commit/eaf0d07bbe460461decba9003a663745f2a4f320))
* **engines:** use package.json for supported Node.js versions ([#723](https://github.com/nodecg/nodecg/issues/723)) ([e27df66](https://github.com/nodecg/nodecg/commit/e27df661fe85235570aeabff87a120899ad6cda0))


### Bug Fixes

* **deps:** update typeorm ([#722](https://github.com/nodecg/nodecg/issues/722)) ([3d02d00](https://github.com/nodecg/nodecg/commit/3d02d00f25a15e37e9226dff201da2c21ed24180))
* **json-schema:** prevent ajv to throw on invalid JSON schema ([#725](https://github.com/nodecg/nodecg/issues/725)) ([9d1af91](https://github.com/nodecg/nodecg/commit/9d1af915aa89e7472008a48386da551fde70db3f))
* **types:** use declarationDir to generate types ([#716](https://github.com/nodecg/nodecg/issues/716)) ([18b1af2](https://github.com/nodecg/nodecg/commit/18b1af2fa667fc65a6a529b86e084ba92d43426c))

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
