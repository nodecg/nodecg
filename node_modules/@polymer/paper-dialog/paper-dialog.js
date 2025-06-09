/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
import '@polymer/polymer/polymer-legacy.js';
import '@polymer/paper-dialog-behavior/paper-dialog-shared-styles.js';

import {NeonAnimationRunnerBehavior} from '@polymer/neon-animation/neon-animation-runner-behavior.js';
import {PaperDialogBehavior} from '@polymer/paper-dialog-behavior/paper-dialog-behavior.js';
import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

/**
Material design:
[Dialogs](https://www.google.com/design/spec/components/dialogs.html)

`<paper-dialog>` is a dialog with Material Design styling and optional
animations when it is opened or closed. It provides styles for a header, content
area, and an action area for buttons. You can use the
`<paper-dialog-scrollable>` element (in its own repository) if you need a
scrolling content area. To autofocus a specific child element after opening the
dialog, give it the `autofocus` attribute. See `Polymer.PaperDialogBehavior` and
`Polymer.IronOverlayBehavior` for specifics.

For example, the following code implements a dialog with a header, scrolling
content area and buttons. Focus will be given to the `dialog-confirm` button
when the dialog is opened.

    <paper-dialog>
      <h2>Header</h2>
      <paper-dialog-scrollable>
        Lorem ipsum...
      </paper-dialog-scrollable>
      <div class="buttons">
        <paper-button dialog-dismiss>Cancel</paper-button>
        <paper-button dialog-confirm autofocus>Accept</paper-button>
      </div>
    </paper-dialog>

### Styling

See the docs for `Polymer.PaperDialogBehavior` for the custom properties
available for styling this element.

### Animations

Set the `entry-animation` and/or `exit-animation` attributes to add an animation
when the dialog is opened or closed. See the documentation in
[PolymerElements/neon-animation](https://github.com/PolymerElements/neon-animation)
for more info.

For example:

    <script type="module">
      import '@polymer/neon-animation/animations/fade-out-animation.js';
      import '@polymer/neon-animation/animations/scale-up-animation.js';
    </script>

    <paper-dialog entry-animation="scale-up-animation"
                  exit-animation="fade-out-animation">
      <h2>Header</h2>
      <div>Dialog body</div>
    </paper-dialog>

### Accessibility

See the docs for `Polymer.PaperDialogBehavior` for accessibility features
implemented by this element.

@group Paper Elements
@element paper-dialog
@hero hero.svg
@demo demo/index.html
*/
Polymer({
  _template: html`
    <style include="paper-dialog-shared-styles"></style>
    <slot></slot>
`,

  is: 'paper-dialog',
  behaviors: [PaperDialogBehavior, NeonAnimationRunnerBehavior],
  listeners: {'neon-animation-finish': '_onNeonAnimationFinish'},

  _renderOpened: function() {
    this.cancelAnimation();
    this.playAnimation('entry');
  },

  _renderClosed: function() {
    this.cancelAnimation();
    this.playAnimation('exit');
  },

  _onNeonAnimationFinish: function() {
    if (this.opened) {
      this._finishRenderOpened();
    } else {
      this._finishRenderClosed();
    }
  }
});
