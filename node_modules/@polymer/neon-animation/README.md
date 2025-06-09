[![Published on NPM](https://img.shields.io/npm/v/@polymer/neon-animation.svg)](https://www.npmjs.com/package/@polymer/neon-animation)
[![Build status](https://travis-ci.org/PolymerElements/neon-animation.svg?branch=master)](https://travis-ci.org/PolymerElements/neon-animation)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/neon-animation)

## neon-animation

`neon-animation` is a suite of elements and behaviors to implement pluggable animated transitions for Polymer Elements using [Web Animations](https://w3c.github.io/web-animations/). Please note that these elements do not include the web-animations polyfill.

See: [Documentation](https://www.webcomponents.org/element/@polymer/neon-animation),
  [Demo](https://www.webcomponents.org/element/@polymer/neon-animation/demo/demo/index.html).

_See [the guide](./guide.md) for detailed usage._

## Usage

### Installation

Element:
```
npm install --save @polymer/neon-animation
```

Polyfill:
```
npm install --save web-animations-js
```

### In an HTML file

### `NeonAnimatableBehavior`
Elements that can be animated by `NeonAnimationRunnerBehavior` should implement the `NeonAnimatableBehavior` behavior, or `NeonAnimationRunnerBehavior` if they're also responsible for running an animation.

#### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {NeonAnimatableBehavior} from '@polymer/neon-animation/neon-animatable-behavior.js';

class SampleElement extends mixinBehaviors([NeonAnimatableBehavior], PolymerElement) {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>

      <slot></slot>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### `NeonAnimationRunnerBehavior`

#### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {NeonAnimationRunnerBehavior} from '@polymer/neon-animation/neon-animation-runner-behavior.js';
import '@polymer/neon-animation/animations/scale-down-animation.js';

class SampleElement extends mixinBehaviors([NeonAnimationRunnerBehavior], PolymerElement) {
  static get template() {
    return html`
      <div>this entire element will be animated after one second</div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();

    // must be set here because properties is static and cannot reference "this"
    this.animationConfig = {
      // provided by neon-animation/animations/scale-down-animation.js
      name: 'scale-down-animation',
      node: this,
    };

    setTimeout(() => this.playAnimation(), 1000);
  }
}
customElements.define('sample-element', SampleElement);
```

### `<neon-animatable>`
A simple element that implements NeonAnimatableBehavior.

#### In an html file
```html
<html>
  <head>
  </head>
  <body>
    <neon-animatable id="animatable">
      <div>this entire element and its parent will be animated after one second</div>
    </neon-animatable>
    <runner-element></runner-element>
    <script type="module">
      import {PolymerElement} from '@polymer/polymer';
      import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
      import {NeonAnimationRunnerBehavior} from '@polymer/neon-animation/neon-animation-runner-behavior.js';
      import '@polymer/neon-animation/neon-animatable.js';
      import '@polymer/neon-animation/animations/scale-down-animation.js';

      const animatable = document.getElementById('animatable');

      class SampleElement extends mixinBehaviors([NeonAnimationRunnerBehavior], PolymerElement) {
        connectedCallback() {
          super.connectedCallback();

          this.animationConfig = {
            // provided by neon-animation/animations/scale-down-animation.js
            name: 'scale-down-animation',
            // node is node to animate
            node: animatable,
          }

          setTimeout(() => this.playAnimation(), 1000);
        }
      }
      customElements.define('runner-element', SampleElement);
    </script>
  </body>
</html>
```

#### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {NeonAnimationRunnerBehavior} from '@polymer/neon-animation/neon-animation-runner-behavior.js';
import '@polymer/neon-animation/neon-animatable.js';
import '@polymer/neon-animation/animations/scale-down-animation.js';

class SampleElement extends mixinBehaviors([NeonAnimationRunnerBehavior], PolymerElement) {
  static get template() {
    return html`
      <div>this div will not be animated</div>
      <neon-animatable id="animatable">
        <div>this div and its parent will be animated after one second</div>
      </neon-animatable>
    `;
  }

  connectedCallback() {
    super.connectedCallback();

    // must be set here because properties is static and cannot reference "this"
    this.animationConfig = {
      // provided by neon-animation/animations/scale-down-animation.js
      name: 'scale-down-animation',
      node: this.$.animatable,
    };

    setTimeout(() => this.playAnimation(), 1000);
  }
}
customElements.define('sample-element', SampleElement);
```

### `<neon-animated-pages>`
`neon-animated-pages` manages a set of pages and runs an animation when
switching between them.

#### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/neon-animation/neon-animated-pages.js';
      import '@polymer/neon-animation/neon-animatable.js';
      import '@polymer/neon-animation/animations/slide-from-right-animation.js';
      import '@polymer/neon-animation/animations/slide-left-animation.js';
    </script>
  </head>
  <body>
    <neon-animated-pages
        id="pages"
        selected="0"
        entry-animation="slide-from-right-animation"
        exit-animation="slide-left-animation">
      <neon-animatable>1</neon-animatable>
      <neon-animatable>2</neon-animatable>
      <neon-animatable>3</neon-animatable>
      <neon-animatable>4</neon-animatable>
      <neon-animatable>5</neon-animatable>
    </neon-animated-pages>
    <button onclick="increase()">+</button>
    <button onclick="decrease()">-</button>
    <script>
      const pages = document.getElementById('pages');
      function increase() { pages.selected = pages.selected + 1 % 5; };
      function decrease() { pages.selected = (pages.selected - 1 + 5) % 5; };
    </script>
  </body>
</html>
```

#### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/neon-animation/neon-animated-pages.js';
import '@polymer/neon-animation/neon-animatable.js';
import '@polymer/neon-animation/animations/slide-from-right-animation.js';
import '@polymer/neon-animation/animations/slide-left-animation.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <neon-animated-pages
          id="pages"
          selected="0"
          entry-animation="slide-from-right-animation"
          exit-animation="slide-left-animation">
        <neon-animatable>1</neon-animatable>
        <neon-animatable>2</neon-animatable>
        <neon-animatable>3</neon-animatable>
        <neon-animatable>4</neon-animatable>
        <neon-animatable>5</neon-animatable>
      </neon-animated-pages>
      <button on-click="increase">+</button>
      <button on-click="decrease">-</button>
    `;
  }

  increase() {
    this.$.pages.selected = this.$.pages.selected + 1 % 5;
  }

  decrease() {
    this.$.pages.selected = (this.$.pages.selected - 1 + 5) % 5;
  }
}
customElements.define('sample-element', SampleElement);
```

#### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {NeonAnimationRunnerBehavior} from '@polymer/neon-animation/neon-animation-runner-behavior.js';
import '@polymer/neon-animation/animations/neon-animatable.js';
import '@polymer/neon-animation/animations/scale-down-animation.js';

class SampleElement extends mixinBehaviors([NeonAnimationRunnerBehavior], PolymerElement) {
  static get template() {
    return html`
      <div>this div will not be animated</div>
      <neon-animatable id="animatable">
        <div>this div and its parent will be animated after one second</div>
      </neon-animatable>
    `;
  }

  connectedCallback() {
    super.connectedCallback();

    // must be set here because properties is static and cannot reference "this"
    this.animationConfig = {
      // provided by neon-animation/animations/scale-down-animation.js
      name: 'scale-down-animation',
      node: this.$.animatable,
    };

    setTimeout(() => this.playAnimation(), 1000);
  }
}
customElements.define('sample-element', SampleElement);
```

## Contributing
If you want to send a PR to this element, here are
the instructions for running the tests and demo locally:

### Installation
```sh
git clone https://github.com/PolymerElements/neon-animation
cd neon-animation
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