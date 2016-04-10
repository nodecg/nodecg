NodeCG v0.8 adds support for [Rollbar](https://rollbar.com/), a service for tracking errors.
Rollbar is especially useful for developers whom manage multiple NodeCG instances and need to be informed
of both server-side and client-side errors as they happen.

To add Rollbar to your NodeCG instance, you'll first need to create a Rollbar account and a Rollbar project.
Then, add the following to your instance's `cfg/nodecg.json`:
```json
{
  "rollbar": {
    "enabled": true,
    "environment": "production",
    "postServerItem": "YOUR_POST_SERVER_ITEM_ACCESS_TOKEN",
    "postClientItem": "YOUR_POST_CLIENT_ITEM_ACCESS_TOKEN"
  }
}
```

Once Rollbar is configured, any uncaught exceptions either on the server or on the client will be reported automatically.
