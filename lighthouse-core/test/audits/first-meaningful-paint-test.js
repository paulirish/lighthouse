/**
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

const FMPAudit = require('../../audits/first-meaningful-paint.js');
const Audit = require('../../audits/audit.js');
const assert = require('assert');
const traceEvents = require('../fixtures/traces/progressive-app.json');
const badNavStartTrace = require('../fixtures/traces/bad-nav-start-ts.json');
const lateTracingStartedTrace = require('../fixtures/traces/tracingstarted-after-navstart.json');
const preactTrace = require('../fixtures/traces/preactjs.com_ts_of_undefined.json');
const noFMPtrace = require('../fixtures/traces/no_fmp_event.json');
const noFCPtrace = require('../fixtures/traces/airhorner_no_fcp');

const GatherRunner = require('../../gather/gather-runner.js');
const computedArtifacts = GatherRunner.instantiateComputedArtifacts();

function generateArtifactsWithTrace(trace) {
  return Object.assign({
    traces: {
      [Audit.DEFAULT_PASS]: {traceEvents: Array.isArray(trace) ? trace : trace.traceEvents}
    }
  }, computedArtifacts);
}

/* eslint-env mocha */
describe('Performance: first-meaningful-paint audit', () => {
  describe('measures the pwa.rocks example correctly', () => {
    let fmpResult;

    it('processes a valid trace file', () => {
      return FMPAudit.audit(generateArtifactsWithTrace(traceEvents)).then(result => {
        fmpResult = result;
      }).catch(_ => {
        assert.ok(false);
      });
    });

    it('finds the expected fMP', () => {
      assert.equal(fmpResult.displayValue, '1099.5ms');
      assert.equal(fmpResult.rawValue, 1099.5);
    });

    it('finds the correct fMP timings', () => {
      assert.equal(fmpResult.extendedInfo.value.timings.fMP, 1099.523);
    });

    it('exposes the FCP timing', () => {
      assert.equal(fmpResult.extendedInfo.value.timings.fCP, 461.901);
    });

    it('exposes the navStart timestamp', () => {
      assert.equal(fmpResult.extendedInfo.value.timestamps.navStart, 668545382727);
    });

    it('scores the fMP correctly', () => {
      assert.equal(fmpResult.score, 99);
    });
  });

  describe('finds correct FMP', () => {
    it('if there was a tracingStartedInPage after the frame\'s navStart', () => {
      return FMPAudit.audit(generateArtifactsWithTrace(lateTracingStartedTrace)).then(result => {
        assert.equal(result.displayValue, '529.9ms');
        assert.equal(result.rawValue, 529.9);
        assert.equal(result.extendedInfo.value.timestamps.navStart, 29343540951);
        assert.equal(result.extendedInfo.value.timings.fCP, 80.054);
        assert.ok(!result.debugString);
      });
    });

    it('if there was a tracingStartedInPage after the frame\'s navStart #2', () => {
      return FMPAudit.audit(generateArtifactsWithTrace(badNavStartTrace)).then(result => {
        assert.equal(result.displayValue, '632.4ms');
        assert.equal(result.rawValue, 632.4);
        assert.equal(result.extendedInfo.value.timestamps.navStart, 8885424467);
        assert.equal(result.extendedInfo.value.timings.fCP, 632.419);
        assert.ok(!result.debugString);
      });
    });

    it('if it appears slightly before the fCP', () => {
      return FMPAudit.audit(generateArtifactsWithTrace(preactTrace)).then(result => {
        assert.equal(result.displayValue, '878.4ms');
        assert.equal(result.rawValue, 878.4);
        assert.equal(result.extendedInfo.value.timestamps.navStart, 1805796384607);
        assert.equal(result.extendedInfo.value.timings.fCP, 879.046);
        assert.ok(!result.debugString);
      });
    });

    it('from candidates if no defined FMP exists', () => {
      return FMPAudit.audit(generateArtifactsWithTrace(noFMPtrace)).then(result => {
        assert.equal(result.displayValue, '4460.9ms');
        assert.equal(result.rawValue, 4460.9);
        assert.equal(result.extendedInfo.value.timings.fCP, 1494.73);
        assert.ok(!result.debugString);
      });
    });
  });

  it('handles traces missing an FCP', () => {
    return FMPAudit.audit(generateArtifactsWithTrace(noFCPtrace)).then(result => {
      assert.strictEqual(result.debugString, undefined);
      assert.strictEqual(result.displayValue, '482.3ms');
      assert.strictEqual(result.rawValue, 482.3);
      assert.strictEqual(result.extendedInfo.value.timings.fCP, undefined);
      assert.strictEqual(result.extendedInfo.value.timings.fMP, 482.318);
      assert.strictEqual(result.extendedInfo.value.timestamps.fCP, undefined);
      assert.strictEqual(result.extendedInfo.value.timestamps.fMP, 2149509604903);
    });
  });
});
