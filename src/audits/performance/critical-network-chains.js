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
const Formatter = require('../../../formatters/formatter');

class CriticalNetworkChains extends Audit {
  /**
   * @override
   */
  static get category() {
    return 'Performance';
  }

  /**
   * @override
   */
  static get name() {
    return 'critical-network-chains';
  }

  /**
   * @override
   */
  static get description() {
    return 'Critical Network Chains';
  }

  /**
   * @override
   */
  static get optimalValue() {
    return 0;
  }

  /**
   * Audits the page to give a score for First Meaningful Paint.
   * @param {!Artifacts} artifacts The artifacts from the gather phase.
   * @return {!AuditResult} The score from the audit, ranging from 0-100.
   */
  static audit(artifacts) {
    return CriticalNetworkChains.generateAuditResult({
      value: artifacts.criticalNetworkChains.length,
      optimalValue: this.optimalValue,
      extendedInfo: {
        formatter: Formatter.SUPPORTED_FORMATS.CRITICAL_NETWORK_CHAINS,
        value: artifacts.criticalNetworkChains
      }
    });
  }
}

module.exports = CriticalNetworkChains;
