# @nodecg-next/server

## 0.1.5

### Patch Changes

- replicant set and update return `Promise` ([`dea0bd2`](https://github.com/Hoishin/nodecg-next/commit/dea0bd2907af76f29e8ca754a410db14acc584a4))
- automatically load child namespaces ([`f805f38`](https://github.com/Hoishin/nodecg-next/commit/f805f38bc9bcd3c5a045bd7fa8d442dbc6cf3bd2))
- Allow linking roles to child namespaces' roles ([`65dafb4`](https://github.com/Hoishin/nodecg-next/commit/65dafb4b55f10428c84d47eb9dfe810ab74d8615))
- WebSocket answers ping with pong ([`7c47ce8`](https://github.com/Hoishin/nodecg-next/commit/7c47ce8bf531659ca5cd4667302b04123267ff2c))

## 0.1.4

### Patch Changes

- effect packages in dependencies are now specified with `^` ([`c7752bd`](https://github.com/Hoishin/nodecg-next/commit/c7752bd75608bb4a32d5feb3aa00a4039072452f))
- replicant, computed and derive subscribers receive the old value as a second argument ([`b8aaab9`](https://github.com/Hoishin/nodecg-next/commit/b8aaab9c26b60b7ddd6132be31f6a3909650b35a))

## 0.1.3

### Patch Changes

- popup login is removed ([`39c449c`](https://github.com/Hoishin/nodecg-next/commit/39c449c1341230a0fbef90d6a0cc29e3e13b3763))
- Field value is refused when an object key is a name every object inherits (`toString`, `constructor`, `__proto__`, etc) ([`76d2eba`](https://github.com/Hoishin/nodecg-next/commit/76d2ebafc04a88308f31b7038f11e47e2ff0a00c))
- replicants declared with `persistent: false` are not written to storage ([`04e8e3d`](https://github.com/Hoishin/nodecg-next/commit/04e8e3d827e9450d35a79e9deb0131addf73d01d))
- the server shuts down on the IPC message `"shutdown"` ([`b5ee674`](https://github.com/Hoishin/nodecg-next/commit/b5ee674c253393088dde8b718f6bd79780ee4b55))

## 0.1.2

### Patch Changes

- field schemas can now be written with Standard Schema (zod, valibot, etc) or JSON Schema (`jsonSchema()`) in addition to Effect Schema ([`d0c1d5c`](https://github.com/Hoishin/nodecg-next/commit/d0c1d5ca5d635a78fc92190a7f086b996f29fdc8))

## 0.1.1

### Patch Changes

- Rename HumanAccount to Authentication ([`ec15619`](https://github.com/Hoishin/nodecg-next/commit/ec1561957d66f6007976380797bca4ea33df86bc))
- Dev mode is set with `NODECG_DEV=true` instead of the `dev` option of `loadNodeCG` ([`b4d2d07`](https://github.com/Hoishin/nodecg-next/commit/b4d2d0750df85aee119c677da8f18ce430aaccb5))
- Separate admin roles as global roles ([`ca0d6dd`](https://github.com/Hoishin/nodecg-next/commit/ca0d6dd68c80f3fe8e7c5f8a615aca66156843d5))
- HTTP response compression ([`b09fad3`](https://github.com/Hoishin/nodecg-next/commit/b09fad36d1467f3f0b489d959d03ec020e10e71b))
- Replicant persistence to JSON files ([`02f265e`](https://github.com/Hoishin/nodecg-next/commit/02f265e4b0ceea7a244085b7e25eb901804d0e52))
- `NODECG_` prefix on every server environment variable ([`02f265e`](https://github.com/Hoishin/nodecg-next/commit/02f265e4b0ceea7a244085b7e25eb901804d0e52))
- Session is renewed only once in NODECG_SESSION_RENEW_INTERVAL config ([`c0c8460`](https://github.com/Hoishin/nodecg-next/commit/c0c8460f1b70686ccbafeff83484191f147188f9))
- stored Replicant value is now validated on load ([`6b14d6f`](https://github.com/Hoishin/nodecg-next/commit/6b14d6f20c37dbe290f3f46462a6184cab5dfcfe))
- Carry role lists as arrays instead of sets ([`a7dd76e`](https://github.com/Hoishin/nodecg-next/commit/a7dd76e449c8e97c8af0a873a33277b5d5750adc))
- Grant and revoke a role by user ID instead of authentication ([`f4fe180`](https://github.com/Hoishin/nodecg-next/commit/f4fe180521fb2c4410291be2fae888b664280658))
- Reject role grant the namespace does not have ([`421582c`](https://github.com/Hoishin/nodecg-next/commit/421582c9455619a2a046b824d0f1e3e1c474c5b9))
- Reject bad role grants with 400 or 422 ([`f21a5dd`](https://github.com/Hoishin/nodecg-next/commit/f21a5dd869381898011dd2e9a050304120c5fa9d))
- Scope role grants to their namespace ([`94420f7`](https://github.com/Hoishin/nodecg-next/commit/94420f79dee7614f85f99f61f16b15f3863a5352))
- Roles import creates missing accounts and merges repeated entries ([`6e95fc9`](https://github.com/Hoishin/nodecg-next/commit/6e95fc90f1c73674befc9c8ea00ae975eb5853fa))
- Rename identity types to user and service account ([`8b2e5eb`](https://github.com/Hoishin/nodecg-next/commit/8b2e5eba2475b9d15c0f54288dd8a328368eec93))
- Persist logins in progress to SQLite ([`a2b9b55`](https://github.com/Hoishin/nodecg-next/commit/a2b9b55efea46f866d36742816590258b545b2c7))
- Persist roles, service accounts and API keys to SQLite ([`4df9436`](https://github.com/Hoishin/nodecg-next/commit/4df943693e0e04826f430fd7ed48ef0e63d03269))
- Persist sessions and users to SQLite ([`4ba4f28`](https://github.com/Hoishin/nodecg-next/commit/4ba4f288620a0a09f66fa1ce8508c501c23a8477))
- Serve frontend dirs with Effect's `HttpStaticServer` instead of sirv ([`a12a133`](https://github.com/Hoishin/nodecg-next/commit/a12a133b73086f23b73de9cefc32f89037175f4f))
- Accept RFC-compatible Bearer header on `/ws/v0` ([`5ef848e`](https://github.com/Hoishin/nodecg-next/commit/5ef848e41d7c13706ed4c64d2bb3c3ef043bd79c))

## 0.1.0

### Minor Changes

- Migrate to Effect 4 (`effect@4.0.0-rc.112`). Effect Schema must come from Effect 4. ([`5a414fa`](https://github.com/Hoishin/nodecg-next/commit/5a414fadf478ad4c8881c0615e437da862b40c78))
