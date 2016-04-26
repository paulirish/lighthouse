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

/* global document, window */

const Gather = require('./gather');
const fs = require('fs');
const axe = fs.readFileSync(
  require.resolve('axe-core/axe.min.js')
);

function runA11yChecks() {
  axe.a11yCheck(document, function(results) {
    // __inspect is magically inserted by driver.evaluateAsync
    window.__inspect(JSON.stringify(results));
  });
}

class Accessibility extends Gather {

  static _errorAccessibility(errorString) {
    return {
      accessibility: {
        raw: undefined,
        value: undefined,
        debugString: errorString
      }
    };
  }

  postProfiling(options) {
    const driver = options.driver;

    return driver.evaluateAsync(`${axe}; (${runA11yChecks.toString()}())`)
    .then(returnedData => {
      const returnedValue = JSON.parse(returnedData.value);

      if (returnedValue.error) {
        this.artifact = Accessibility._errorAccessibility(returnedValue.error);
      } else {
        this.artifact = {
          accessibility: returnedValue
        };
      }
    });
  }
}

module.exports = Accessibility;
