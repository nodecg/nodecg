NodeCG v0.9 adds support for [Sentry.io](https://sentry.io/), a service for tracking errors.
Sentry is especially useful for developers whom manage multiple NodeCG instances and need to be informed
of both server-side and client-side errors as they happen.

To add Sentry to your NodeCG instance, you'll first need to create a Sentry account and a Sentry project.
Then, add the following to your instance's `cfg/nodecg.json`:
```json
{
  "sentry": {
    "enabled": true,
    "dsn": "your project's DSN, used to report server-side errors",
    "publicDsn": "your project's public DSN, used to report client-side errors"
  }
}
```

Once Sentry is configured, any uncaught exceptions or unhandled promise rejections either on the server or on the client will be reported automatically.

In addition, any use of `nodecg.log.error` will also be reported to Sentry.
