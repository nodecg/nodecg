# Contribute

Please contribute! This is an open source project. If you would like to report a bug or suggest a feature, [open an issue](https://github.com/nodecg/nodecg/issues). Or, to open a Pull Request:

1. Fork it ( http://github.com/nodecg/nodecg/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

**Before creating your pull request:**

1. Ensure your code matches our existing style using our provided [EditorConfig](http://editorconfig.org/) options.
2. Ensure the existing tests pass, or are updated appropriately, with `npm test`.
3. For new features, you should add new tests.

Check which branch you should PR to. NodeCG is still in an unstable state, so we follow these [semver](http://semver.org/) guidelines:
- Bug fixes and new features go to the next 'patch' branch (`0.current.x`)
- Breaking changes go to the next 'minor' branch (`0.next.0`)

### Running tests locally
1. Install selenium-standalone (`npm install --global selenium-standalone`), then run the installer (`selenium-standalone install`)
2. Open one terminal and start Selenium: `selenium-standalone start`
3. Open a second terminal, navigate to the NodeCG root and run `npm test`