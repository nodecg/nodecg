Utility method for detecting that an application using Vaadin Elements is running in development mode

## Running Tests

There are no automatic tests as the functionality depends on the host the code is run on (localhost vs others) and the bundling status.

To verify functionality:
1. Run `npm install`
1. Run `bower install`
1. Run `npm start`
1. Open http://localhost:8081/test/index.html
  1. Verify that `mode` is `development` (green)
  1. Verify that `importIfDevelopmentMode` is `run` (green)
1. Open http://`<yourip>`:8081/test/index.html
  1. Verify that `mode` is `production` (orange)
  1. Verify that `importIfDevelopmentMode` is `ignored` (orange)
1. Run `npm run start:prod`
1. Open http://localhost:8081/test/index.html
  1. Verify that `mode` is `production` (orange)
  1. Verify that `importIfDevelopmentMode` is `ignored` (orange)
1. Open http://`<yourip>`:8081/test/index.html
    1. Verify that `mode` is `production` (orange)
    1. Verify that `importIfDevelopmentMode` is `ignored` (orange)
