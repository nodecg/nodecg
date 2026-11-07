# @nodecg-next/core

## 0.1.5

### Patch Changes

- automatically load child namespaces ([`f805f38`](https://github.com/Hoishin/nodecg-next/commit/f805f38bc9bcd3c5a045bd7fa8d442dbc6cf3bd2))
- Allow linking roles to child namespaces' roles ([`65dafb4`](https://github.com/Hoishin/nodecg-next/commit/65dafb4b55f10428c84d47eb9dfe810ab74d8615))

## 0.1.4

### Patch Changes

- effect packages in dependencies are now specified with `^` ([`c7752bd`](https://github.com/Hoishin/nodecg-next/commit/c7752bd75608bb4a32d5feb3aa00a4039072452f))
- the `client` principal is renamed to `member` ([`b6d2513`](https://github.com/Hoishin/nodecg-next/commit/b6d25139483bacc21af8b6cfffdc4016ecc81042))

## 0.1.3

### Patch Changes

- Field value is refused when an object key is a name every object inherits (`toString`, `constructor`, `__proto__`, etc) ([`76d2eba`](https://github.com/Hoishin/nodecg-next/commit/76d2ebafc04a88308f31b7038f11e47e2ff0a00c))
- replicants declared with `persistent: false` are not written to storage ([`04e8e3d`](https://github.com/Hoishin/nodecg-next/commit/04e8e3d827e9450d35a79e9deb0131addf73d01d))

## 0.1.2

### Patch Changes

- field schemas can now be written with Standard Schema (zod, valibot, etc) or JSON Schema (`jsonSchema()`) in addition to Effect Schema ([`d0c1d5c`](https://github.com/Hoishin/nodecg-next/commit/d0c1d5ca5d635a78fc92190a7f086b996f29fdc8))

## 0.1.1

### Patch Changes

- File-safe namespace and replicant names ([`02f265e`](https://github.com/Hoishin/nodecg-next/commit/02f265e4b0ceea7a244085b7e25eb901804d0e52))
- Separate admin roles as global roles ([`ca0d6dd`](https://github.com/Hoishin/nodecg-next/commit/ca0d6dd68c80f3fe8e7c5f8a615aca66156843d5))
- Carry role lists as arrays instead of sets ([`a7dd76e`](https://github.com/Hoishin/nodecg-next/commit/a7dd76e449c8e97c8af0a873a33277b5d5750adc))
- Scope role grants to their namespace ([`94420f7`](https://github.com/Hoishin/nodecg-next/commit/94420f79dee7614f85f99f61f16b15f3863a5352))
- Rename identity types to user and service account ([`8b2e5eb`](https://github.com/Hoishin/nodecg-next/commit/8b2e5eba2475b9d15c0f54288dd8a328368eec93))

## 0.1.0

### Minor Changes

- Migrate to Effect 4 (`effect@4.0.0-rc.112`). Effect Schema must come from Effect 4. ([`5a414fa`](https://github.com/Hoishin/nodecg-next/commit/5a414fadf478ad4c8881c0615e437da862b40c78))
