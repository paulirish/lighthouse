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

class ARIAValidAttr extends Audit {
  /**
   * @override
   */
  static get tags() {
    return ['Accessibility'];
  }

  /**
   * @override
   */
  static get name() {
    return 'aria-valid-attr';
  }

  /**
   * @override
   */
  static get description() {
    return 'Ensures attributes that begin with aria- are valid ARIA attributes';
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const rule =
        artifacts.accessibility.violations.find(result => result.id === 'aria-valid-attr');

    return ARIAValidAttr.generateAuditResult(
      typeof rule === 'undefined',
      undefined,
      this.createDebugString(rule)
    );
  }

  static createDebugString(rule) {
    if (typeof rule === 'undefined') {
      return '';
    }

    return rule.help + ' (Failed on ' +
      rule.nodes.reduce((prev, node) => {
        return prev + `"${node.target.join(', ')}"`;
      }, '') + ')';
  }
}

module.exports = ARIAValidAttr;
