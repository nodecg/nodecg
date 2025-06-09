# JSON Schema Defaults

> A library and CLI tool for generating a default value from a JSON schema

## Installation

```sh
npm install @nodecg/json-schema-defaults
```

## Usage

- Node (TypeScript/ESM)

  ```js
  import defaults from 'json-schema-defaults';
  defaults({ ... });
  ```

- CLI

  If installed globally:

  ```sh
  json-schema-defaults schema.json
  ```

  If locally:

  ```sh
  ./node_modules/.bin/json-schema-defaults schema.json
  ```

  Custom indentation (defaults to 2):

  ```sh
  json-schema-defaults --indent 4 schema.json
  ```

  Write into a file:

  ```sh
  json-schema-defaults schema.json > defaults.json
  ```

## Documentation

Call `defaults` with JSON Schema. The default values will be extracted as a JSON.

```ts
const json = defaults({
  "title": "Album Options",
  "type": "object",
  "properties": {
    "sort": {
      "type": "string",
      "default": "id"
    },
    "per_page": {
      "default": 30,
      "type": "integer"
    }
  }
});

// would return
{
  sort: 'id',
  per_page: 30
}
```

For more examples, see the tests.

## Development

Run tests

```sh
npm test
```

## Contributors

- Eugene Tsypkin @jhony-chikens (original author of [`json-schema-defaults`](https://www.npmjs.com/package/json-schema-defaults) on npm)
- Alex Van Camp @alvancamp

## License

(c) 2023 The NodeCG Project. Released under the terms of the MIT License.
