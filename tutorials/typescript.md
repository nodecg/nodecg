NodeCG includes TypeScript type definitions for NodeCG APIs.

## Setup

Install TypeScript and required type definitions.

```sh
npm install -D typescript @types/node @types/express @types/socket.io @types/socket.io-client @types/soundjs
# or
yarn add -D typescript @types/node @types/express @types/socket.io @types/socket.io-client @types/soundjs
```

## Typing Replicants

Optionally, you can define types of replicants using replicants' JSON schema.

1. Define schema for replicants
1. Use https://github.com/bcherny/json-schema-to-typescript to convert JSON schema to TypeScript type definitions
1. Import the type and pass it to type parameter like this:
```ts
const rep = nodecg.Replicant<SchemaTypeDef>('schemaTypeDef')
```

## Using Type Definitions

More examples are available in `typetest` directory, which is also used to test the type definitions.

### extension

```ts
// Directly import the type definition file
import {NodeCG} from '../../../../types/server'

export = (nodecg: NodeCG) => {
  nodecg.sendMessage('message')
}
```

### dashboard/graphics

```ts
/// <reference path="../../../../types/browser.d.ts" />

nodecg.listenFor('message', () => {
  // ...
})
```
