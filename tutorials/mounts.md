As of v0.9.9, NodeCG supports a `nodecg.mount` array in your bundle's `package.json`. These `mount` declarations are simple objects with two keys: `directory` and `endpoint`.

`directory` is a relative path from the root of your bundle which tells NodeCG which folder you'd like to mount as a custom endpoint.

`endpoint` is a URL relative to `http://localhost:9090/bundles/${bundle.name}/` which tells NodeCG what URL you'd like to serve your `directory` from (Of course, substitute `localhost` and `9090` with whatever `host` and `port` your NodeCG instance is configured to use).

```json
{
  "name": "test-bundle",
  "nodecg": {
    "mount": [
      {
        "directory": "custom-dir",
        "endpoint": "my-mount-endpoint"
      }
    ]
  }
}
```

The above example will make the contents of `nodecg/bundles/test-bundle/custom-dir` accessible via `http://localhost:9090/bundles/test-bundle/my-mount-endpoint`. These endpoints behave similarly to how [Express' `static` method](https://expressjs.com/en/starter/static-files.html) serves static files from folders.

For example, if `custom-dir` contains a file called `hello-world.html`, that file can be accessed via the URL `http://localhost:9090/bundles/test-bundle/my-mount-endpoint/hello-world.html`.
