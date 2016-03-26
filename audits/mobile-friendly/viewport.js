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

const Audit = require('../audit');

class Viewport extends Audit {

  static get tags() {
    return ['Mobile Friendly'];
  }

  static get name() {
    return 'viewport';
  }

  static get description() {
    return 'Site has a viewport meta tag';
  }

  static audit(inputs) {
    let hasViewport = false;
    if (inputs.window) {
      const viewportElements =
        inputs.window.document.querySelectorAll('head meta[name="viewport"]');

      if (viewportElements.length === 1 &&
        viewportElements[0].getAttribute('content').indexOf('width=') !== -1) {
        hasViewport = true;
      }
    }

    return Viewport.generateAuditResult(hasViewport);
  }
}

module.exports = Viewport;
