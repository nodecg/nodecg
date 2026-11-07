# @nodecg-next/client

## 0.1.5

### Patch Changes

- the client reconnects a WebSocket that went silent ([`7c47ce8`](https://github.com/Hoishin/nodecg-next/commit/7c47ce8bf531659ca5cd4667302b04123267ff2c))

## 0.1.4

### Patch Changes

- effect packages in dependencies are now specified with `^` ([`c7752bd`](https://github.com/Hoishin/nodecg-next/commit/c7752bd75608bb4a32d5feb3aa00a4039072452f))
- replicant, computed and derive subscribers receive the old value as a second argument ([`b8aaab9`](https://github.com/Hoishin/nodecg-next/commit/b8aaab9c26b60b7ddd6132be31f6a3909650b35a))

## 0.1.3

### Patch Changes

- client `loadNodeCG` loading several namespaces over one connection ([`06978bf`](https://github.com/Hoishin/nodecg-next/commit/06978bfc834fca511e010f814c025799024bd6a3))
- the client socket reconnects on disconnection with backoff and re-subscribes every live field ([`e82b7d4`](https://github.com/Hoishin/nodecg-next/commit/e82b7d4615c8a677d13fffbe8e0c3f6bf891fb96))
- popup login is removed ([`39c449c`](https://github.com/Hoishin/nodecg-next/commit/39c449c1341230a0fbef90d6a0cc29e3e13b3763))
- Field value is refused when an object key is a name every object inherits (`toString`, `constructor`, `__proto__`, etc) ([`76d2eba`](https://github.com/Hoishin/nodecg-next/commit/76d2ebafc04a88308f31b7038f11e47e2ff0a00c))

## 0.1.2

### Patch Changes

- field schemas can now be written with Standard Schema (zod, valibot, etc) or JSON Schema (`jsonSchema()`) in addition to Effect Schema ([`d0c1d5c`](https://github.com/Hoishin/nodecg-next/commit/d0c1d5ca5d635a78fc92190a7f086b996f29fdc8))

## 0.1.1

### Patch Changes

- Separate admin roles as global roles ([`ca0d6dd`](https://github.com/Hoishin/nodecg-next/commit/ca0d6dd68c80f3fe8e7c5f8a615aca66156843d5))
- Carry role lists as arrays instead of sets ([`a7dd76e`](https://github.com/Hoishin/nodecg-next/commit/a7dd76e449c8e97c8af0a873a33277b5d5750adc))
- Grant and revoke a role by user ID instead of authentication ([`f4fe180`](https://github.com/Hoishin/nodecg-next/commit/f4fe180521fb2c4410291be2fae888b664280658))
- Scope role grants to their namespace ([`94420f7`](https://github.com/Hoishin/nodecg-next/commit/94420f79dee7614f85f99f61f16b15f3863a5352))
- Rename identity types to user and service account ([`8b2e5eb`](https://github.com/Hoishin/nodecg-next/commit/8b2e5eba2475b9d15c0f54288dd8a328368eec93))

## 0.1.0

### Minor Changes

- Migrate to Effect 4 (`effect@4.0.0-rc.112`). Effect Schema must come from Effect 4. ([`5a414fa`](https://github.com/Hoishin/nodecg-next/commit/5a414fadf478ad4c8881c0615e437da862b40c78))
