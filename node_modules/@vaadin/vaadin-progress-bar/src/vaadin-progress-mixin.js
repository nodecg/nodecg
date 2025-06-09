/**
@license
Copyright (c) 2017 Vaadin Ltd.
This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
*/
/**
 * @polymerMixin
 */
export const ProgressMixin = superClass =>
  class VaadinProgressMixin extends superClass {
    static get properties() {
      return {
        /**
         * Current progress value.
         */
        value: {
          type: Number,
          observer: '_valueChanged'
        },
        /**
         * Minimum bound of the progress bar.
         * @type {number}
         */
        min: {
          type: Number,
          value: 0,
          observer: '_minChanged'
        },
        /**
         * Maximum bound of the progress bar.
         * @type {number}
         */
        max: {
          type: Number,
          value: 1,
          observer: '_maxChanged'
        },
        /**
         * Indeterminate state of the progress bar.
         * This property takes precedence over other state properties (min, max, value).
         * @type {boolean}
         */
        indeterminate: {
          type: Boolean,
          value: false,
          reflectToAttribute: true
        }
      };
    }

    static get observers() {
      return [
        '_normalizedValueChanged(value, min, max)'
      ];
    }

    /** @protected */
    ready() {
      super.ready();

      this.setAttribute('role', 'progressbar');
    }

    /** @private */
    _normalizedValueChanged(value, min, max) {
      const newNormalizedValue = this._normalizeValue(value, min, max);

      this.style.setProperty('--vaadin-progress-value', newNormalizedValue);

      this.updateStyles({
        '--vaadin-progress-value': String(newNormalizedValue)
      });
    }

    /** @private */
    _valueChanged(newV, oldV) {
      this.setAttribute('aria-valuenow', newV);
    }

    /** @private */
    _minChanged(newV, oldV) {
      this.setAttribute('aria-valuemin', newV);
    }

    /** @private */
    _maxChanged(newV, oldV) {
      this.setAttribute('aria-valuemax', newV);
    }

    /**
     * Percent of current progress relative to whole progress bar (max - min)
     * @private
     */
    _normalizeValue(value, min, max) {
      let nV;

      if (!value && value != 0) {
        nV = 0;
      } else if (min >= max) {
        nV = 1;
      } else {
        nV = (value - min) / (max - min);

        nV = Math.min(Math.max(nV, 0), 1);
      }

      return nV;
    }
  };
