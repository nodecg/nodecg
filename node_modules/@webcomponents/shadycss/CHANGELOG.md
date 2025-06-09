# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- ## Unreleased -->

## [1.11.1] - 2022-10-20

- Upstream internal changes to 'style-settings.js'.
  ([#467](https://github.com/webcomponents/polyfills/pull/467))

## [1.11.0] - 2021-08-02

- Add TS externs. ([#457](https://github.com/webcomponents/polyfills/pull/457))

## [1.10.2] - 2020-10-21

- Maintenance release (no user-facing changes)

## [1.10.1] - 2020-07-20

- Maintenance release (no user-facing changes)

## [1.10.0] - 2020-06-03

- Add `@webcomponents/shadycss` module, an interface to ShadyCSS polyfills that
  is importable, type-safe, and easier to use than the `window.ShadyCSS`
  globals.

## [1.9.6] - 2020-03-16

- Closure type annotation improvements ([#284](https://github.com/webcomponents/polyfills/pull/284), [#280](https://github.com/webcomponents/polyfills/pull/280))

## [1.9.5] - 2020-02-26

- Maintenance release (no user-facing changes)

## [1.9.4] - 2020-01-08

- Fix Edge bug where cloned style would not apply correctly
  ([#242](https://github.com/webcomponents/polyfills/pull/242))

## [1.9.3] - 2019-11-12

- When the apply shim is loaded, update custom-styles even if none are currently
  enqueued ([#208](https://github.com/webcomponents/polyfills/pull/208))
