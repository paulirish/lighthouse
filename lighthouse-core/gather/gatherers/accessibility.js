/**
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

/* global window, document */

const Gatherer = require('./gatherer');
const fs = require('fs');
const axeLibSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

// This is run in the page, not Lighthouse itself.
// axe.run returns a promise which fulfills with a results object
// containing any violations.
/* istanbul ignore next */
function runA11yChecks() {
  return window.axe.run(document, {
    runOnly: {
      type: 'tag',
      values: [
        'wcag2a',
        'wcag2aa'
      ]
    },
    rules: {
      'tabindex': {enabled: true},
      'table-fake-caption': {enabled: true},
      'td-has-header': {enabled: true},
      'area-alt': {enabled: false},
      'blink': {enabled: false},
      'server-side-image-map': {enabled: false}
    }
  });
}

class Accessibility extends Gatherer {
  /**
   * @param {!Object} options
   * @return {!Promise<{violations: !Array}>}
   */
  afterPass(options) {
    const driver = options.driver;
    const expression = `(function () {
      ${axeLibSource};
      return (${runA11yChecks.toString()}());
    })()`;

    return driver
      .evaluateAsync(expression)
      .then(returnedValue => {
        if (!returnedValue || !Array.isArray(returnedValue.violations)) {
          throw new Error('Unable to parse axe results' + returnedValue);
        }

        return returnedValue;
      });
  }
}

module.exports = Accessibility;
