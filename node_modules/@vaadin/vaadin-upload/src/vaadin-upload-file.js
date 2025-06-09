/**
@license
Copyright (c) 2017 Vaadin Ltd.
This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
*/
import { PolymerElement } from '@polymer/polymer/polymer-element.js';

import { ThemableMixin } from '@vaadin/vaadin-themable-mixin/vaadin-themable-mixin.js';
import '@vaadin/vaadin-progress-bar/src/vaadin-progress-bar.js';
import './vaadin-upload-icons.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';

/**
 * `<vaadin-upload-file>` element represents a file in the file list of `<vaadin-upload>`.
 *
 * ### Styling
 *
 * The following shadow DOM parts are available for styling:
 *
 * Part name | Description
 * ---|---
 * `row` | File container
 * `info` | Container for file status icon, file name, status and error messages
 * `done-icon` | File done status icon
 * `warning-icon` | File warning status icon
 * `meta` | Container for file name, status and error messages
 * `name` | File name
 * `error` | Error message, shown when error happens
 * `status` | Status message
 * `commands` | Container for file command icons
 * `start-button` | Start file upload button
 * `retry-button` | Retry file upload button
 * `clear-button` | Clear file button
 * `progress`| Progress bar
 *
 * The following state attributes are available for styling:
 *
 * Attribute | Description | Part name
 * ---|---|---
 * `error` | An error has happened during uploading | `:host`
 * `indeterminate` | Uploading is in progress, but the progress value is unknown | `:host`
 * `uploading` | Uploading is in progress | `:host`
 * `complete` | Uploading has finished successfully | `:host`
 *
 * See [ThemableMixin – how to apply styles for shadow parts](https://github.com/vaadin/vaadin-themable-mixin/wiki)
 *
 * @extends PolymerElement
 * @mixes ThemableMixin
 * @demo demo/index.html
 */
class UploadFileElement extends ThemableMixin(PolymerElement) {
  static get template() {
    return html`
    <style>
      :host {
        display: block;
      }

      [hidden] {
        display: none;
      }
    </style>

    <div part="row">
      <div part="info">
        <div part="done-icon" hidden\$="[[!file.complete]]"></div>
        <div part="warning-icon" hidden\$="[[!file.error]]"></div>

        <div part="meta">
          <div part="name" id="name">[[file.name]]</div>
          <div part="status" hidden\$="[[!file.status]]" id="status">[[file.status]]</div>
          <div part="error" id="error" hidden\$="[[!file.error]]">[[file.error]]</div>
        </div>
      </div>
      <div part="commands">
        <div part="start-button" file-event="file-start" on-click="_fireFileEvent" hidden\$="[[!file.held]]"></div>
        <div part="retry-button" file-event="file-retry" on-click="_fireFileEvent" hidden\$="[[!file.error]]"></div>
        <div part="clear-button" file-event="file-abort" on-click="_fireFileEvent"></div>
      </div>
    </div>

    <vaadin-progress-bar part="progress" id="progress" value\$="[[_formatProgressValue(file.progress)]]" error\$="[[file.error]]" indeterminate\$="[[file.indeterminate]]" uploading\$="[[file.uploading]]" complete\$="[[file.complete]]">
    </vaadin-progress-bar>
`;
  }

  static get is() {
    return 'vaadin-upload-file';
  }

  static get properties() {
    return {
      file: Object
    };
  }

  static get observers() {
    return [
      '_fileAborted(file.abort)',
      '_toggleHostAttribute(file.error, "error")',
      '_toggleHostAttribute(file.indeterminate, "indeterminate")',
      '_toggleHostAttribute(file.uploading, "uploading")',
      '_toggleHostAttribute(file.complete, "complete")',
    ];
  }

  _fileAborted(abort) {
    if (abort) {
      this._remove();
    }
  }

  _remove() {
    this.dispatchEvent(
      new CustomEvent('file-remove', {
        detail: {file: this.file},
        bubbles: true,
        composed: true
      })
    );
  }

  _formatProgressValue(progress) {
    return progress / 100;
  }

  _fireFileEvent(e) {
    e.preventDefault();
    return this.dispatchEvent(
      new CustomEvent(e.target.getAttribute('file-event'), {
        detail: {file: this.file},
        bubbles: true,
        composed: true
      })
    );
  }

  _toggleHostAttribute(value, attributeName) {
    const shouldHave = Boolean(value);
    const has = this.hasAttribute(attributeName);
    if (has !== shouldHave) {
      if (shouldHave) {
        this.setAttribute(attributeName, '');
      } else {
        this.removeAttribute(attributeName);
      }
    }
  }

  /**
  * Fired when the retry button is pressed. It is listened by `vaadin-upload`
  * which will start a new upload process of this file.
  *
  * @event file-retry
  * @param {Object} detail
  * @param {Object} detail.file file to retry upload of
  */

  /**
  * Fired when the start button is pressed. It is listened by `vaadin-upload`
  * which will start a new upload process of this file.
  *
  * @event file-start
  * @param {Object} detail
  * @param {Object} detail.file file to start upload of
  */

  /**
   * Fired when abort button is pressed. It is listened by `vaadin-upload` which
   * will abort the upload in progress, but will not remove the file from the list
   * to allow the animation to hide the element to be run.
   *
   * @event file-abort
   * @param {Object} detail
   * @param {Object} detail.file file to abort upload of
   */

  /**
   * Fired after the animation to hide the element has finished. It is listened
   * by `vaadin-upload` which will actually remove the file from the upload
   * file list.
   *
   * @event file-remove
   * @param {Object} detail
   * @param {Object} detail.file file to remove from the  upload of
   */
}

customElements.define(UploadFileElement.is, UploadFileElement);

export { UploadFileElement };
