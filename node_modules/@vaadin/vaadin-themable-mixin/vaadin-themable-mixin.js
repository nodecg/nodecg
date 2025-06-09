import { DomModule } from '@polymer/polymer/lib/elements/dom-module.js';
import { ThemePropertyMixin } from './vaadin-theme-property-mixin.js';

/**
 * @polymerMixin
 * @mixes ThemePropertyMixin
 */
export const ThemableMixin = superClass => class VaadinThemableMixin extends ThemePropertyMixin(superClass) {

  /** @protected */
  static finalize() {
    super.finalize();

    const template = this.prototype._template;

    const hasOwnTemplate = this.template && this.template.parentElement && this.template.parentElement.id === this.is;
    const inheritedTemplate = Object.getPrototypeOf(this.prototype)._template;
    if (inheritedTemplate && !hasOwnTemplate) {
      // The element doesn't define its own template -> include the theme modules from the inherited template
      Array.from(inheritedTemplate.content.querySelectorAll('style[include]')).forEach(s => {
        this._includeStyle(s.getAttribute('include'), template);
      });
    }

    this._includeMatchingThemes(template);
  }

  /** @private */
  static _includeMatchingThemes(template) {
    const domModule = DomModule;
    const modules = domModule.prototype.modules;

    let hasThemes = false;
    const defaultModuleName = this.is + '-default-theme';

    Object.keys(modules)
      .sort((moduleNameA, moduleNameB) => {
        const vaadinA = moduleNameA.indexOf('vaadin-') === 0;
        const vaadinB = moduleNameB.indexOf('vaadin-') === 0;

        const vaadinThemePrefixes = ['lumo-', 'material-'];
        const vaadinThemeA = vaadinThemePrefixes.filter(prefix => moduleNameA.indexOf(prefix) === 0).length > 0;
        const vaadinThemeB = vaadinThemePrefixes.filter(prefix => moduleNameB.indexOf(prefix) === 0).length > 0;

        if (vaadinA !== vaadinB) {
          // Include vaadin core styles first
          return vaadinA ? -1 : 1;
        } else if (vaadinThemeA !== vaadinThemeB) {
          // Include vaadin theme styles after that
          return vaadinThemeA ? -1 : 1;
        } else {
          // Lastly include custom styles so they override all vaadin styles
          return 0;
        }
      })
      .forEach(moduleName => {
        if (moduleName !== defaultModuleName) {
          const themeFor = modules[moduleName].getAttribute('theme-for');
          if (themeFor) {
            themeFor.split(' ').forEach(themeForToken => {
              if (new RegExp('^' + themeForToken.split('*').join('.*') + '$').test(this.is)) {
                hasThemes = true;
                this._includeStyle(moduleName, template);
              }
            });
          }
        }
      });

    if (!hasThemes && modules[defaultModuleName]) {
      // No theme modules found, include the default module if it exists
      this._includeStyle(defaultModuleName, template);
    }
  }

  /** @private */
  static _includeStyle(moduleName, template) {
    if (template && !template.content.querySelector(`style[include="${moduleName}"]`)) {
      const styleEl = document.createElement('style');
      styleEl.setAttribute('include', moduleName);
      template.content.appendChild(styleEl);
    }
  }

};
