
<!---

This README is automatically generated from the comments in these files:
iron-a11y-announcer.html

Edit those files, and our readme bot will duplicate them over here!
Edit this file, and the bot will squash your changes :)

The bot does some handling of markdown. Please file a bug if it does the wrong
thing! https://github.com/PolymerLabs/tedium/issues

-->
[![Published on NPM](https://img.shields.io/npm/v/@polymer/iron-a11y-announcer.svg)](https://www.npmjs.com/package/@polymer/iron-a11y-announcer)
[![Build status](https://travis-ci.org/PolymerElements/iron-a11y-announcer.svg?branch=master)](https://travis-ci.org/PolymerElements/iron-a11y-announcer)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/iron-a11y-announcer)

## &lt;iron-a11y-announcer&gt;

`iron-a11y-announcer` is a singleton element that is intended to add a11y
to features that require on-demand announcement from screen readers. In
order to make use of the announcer, it is best to request its availability
in the announcing element.
Note: announcements are only audible if you have a screen reader enabled.

See: [Documentation](https://www.webcomponents.org/element/@polymer/iron-a11y-announcer),
  [Demo](https://www.webcomponents.org/element/@polymer/iron-a11y-announcer/demo/demo/index.html)

## Usage

### Installation
```
npm install --save @polymer/iron-a11y-announcer
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import {IronA11yAnnouncer} from '@polymer/iron-a11y-announcer/iron-a11y-announcer.js';
      // Initialize the announcer.
      IronA11yAnnouncer.requestAvailability();

      // Note: announcements are only audible if you have a screen reader enabled.
      IronA11yAnnouncer.instance.fire('iron-announce',
          {text: 'Hello there!'}, {bubbles: true});
    </script>
  </head>
</html>
```

### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import {IronA11yAnnouncer} from '@polymer/iron-a11y-announcer/iron-a11y-announcer.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <button on-click="announce">Announce</button>
    `;
  }
  function attached() {
    IronA11yAnnouncer.requestAvailability();
  }

  // After the `iron-a11y-announcer` has been made available, elements can
  // make announces by firing bubbling `iron-announce` events.
  // Note: announcements are only audible if you have a screen reader enabled.
  function announce() {
    IronA11yAnnouncer.instance.fire('iron-announce',
        {text: 'Hello there!'}, {bubbles: true});
  }
}
customElements.define('sample-element', SampleElement);
```

## Contributing
If you want to send a PR to this element, here are
the instructions for running the tests and demo locally:

### Installation
```sh
git clone https://github.com/PolymerElements/iron-a11y-announcer
cd iron-a11y-announcer
npm install
npm install -g polymer-cli
```

### Running the demo locally
```sh
polymer serve --npm
open http://127.0.0.1:<port>/demo/
```

### Running the tests
```sh
polymer test --npm
```

## Known Issues
This element doesn't work on Firefox (it doesn't read anything in Voice Over), since
`aria-live` has been broken since the Quantum redesign (see the [MDN docs demo](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions))
-- we tested it on Firefox 60, but it doesn't look like a regression, so
it's probably broken on older versions as well.
