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
const TracingProcessor = require('../../lib/traces/tracing-processor');

class InputReadinessMetric extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      category: 'Performance',
      name: 'input-readiness',
      description: 'Estimated Input Latency',
      optimalValue: '100',  // SCORING_POINT_OF_DIMINISHING_RETURNS.toLocaleString()
      requiredArtifacts: ['traceContents', 'speedline']
    };
  }

  /**
   * Audits the page to give a score for Input Readiness.
   * @see https://github.com/GoogleChrome/lighthouse/issues/26
   * @param {!Artifacts} artifacts The artifacts from the gather phase.
   * @return {!AuditResult} The score from the audit, ranging from 0-100.
   */
  static audit(artifacts) {
    try {
      // Use speedline's first paint as start of range for input readiness check.
      const startTime = artifacts.speedline.first;

      let readiness = TracingProcessor.getRiskToResponsiveness(artifacts.traceContents, startTime);

      const str = readiness.reduce((str, result, index) => {
        const preamble = index === 0 ? '' : ', ';
        const percentage = Math.round(result.percentile * 100) + '%';
        const value = result.time.toFixed(1) + 'ms';
        str += `${preamble}${percentage}: ${value}`;
        return str;
      }, '');

      const readinessScore = readiness[0].time;
      const rawValue = str;

      return InputReadinessMetric.generateAuditResult({
        value: readinessScore,
        rawValue: rawValue,
        optimalValue: this.meta.optimalValue
      });
    } catch (err) {
      return InputReadinessMetric.generateAuditResult({
        value: -1,
        debugString: 'Unable to parse trace contents: ' + err.message
      });
    }
  }
}

module.exports = InputReadinessMetric;
