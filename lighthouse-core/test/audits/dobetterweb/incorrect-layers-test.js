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

const IncorrectLayers =
    require('../../../audits/dobetterweb/incorrect-layers');
const assert = require('assert');
const layersAudit = require('../../fixtures/layers-audit.json');

/* eslint-env mocha */

describe('Incorrect Layers audit', () => {
  it('fails when Incorrect layers found', () => {
    const auditResult = IncorrectLayers.audit(layersAudit);
    const invalidateCase = auditResult.extendedInfo.value.results[12];
    const overlapCase = auditResult.extendedInfo.value.results[17];

    assert.equal(auditResult.rawValue, false);
    assert.ok(auditResult.displayValue.match('Total Layer Count: 22, Layer Memory: 57MB'));
    assert.equal(auditResult.extendedInfo.value.results.length, 22);

    assert.ok(invalidateCase.layerId, '━━━━━━━━━━━━div#_MM_FLICK_FIRST_PANEL.flick-panel');
    assert.equal(invalidateCase.overlap, '');
    assert.equal(invalidateCase.invalidate, '✔ (6MB, 13)');

    assert.ok(overlapCase.layerId, '━━━━━━━━━━div#nav.nav');
    assert.equal(overlapCase.overlap, '✔');
    assert.equal(overlapCase.invalidate, '');
  });

  it('passes when Incorrect layers not found', () => {
    const correctMockData = {
      Layers: [
        {id: '#document',
          paintCount: 18,
          memory: 0,
          layerId: '23',
          parentLayerId: null,
          compositingReasons: ['root'],
          width: 412,
          height: 4230},
        {id: 'div.flick-container',
          paintCount: 0,
          memory: 0,
          layerId: '58',
          parentLayerId: '23',
          compositingReasons: ['layerForAncestorClip'],
          width: 412,
          height: 3922}
      ]
    };

    const auditResult = IncorrectLayers.audit(correctMockData);

    assert.equal(auditResult.rawValue, true);
    assert.ok(auditResult.displayValue.match('Total Layer Count: 2, Layer Memory: 0 Byte'));
    assert.equal(auditResult.extendedInfo.value.results.length, 2);
  });
});
