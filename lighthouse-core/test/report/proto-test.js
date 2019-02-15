/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path = require('path');
const fs = require('fs');

const sample = fs.readFileSync(path.resolve(__dirname, '../results/sample_v2.json'));
const roundTripJson = require('../../../proto/sample_v2_round_trip');
const preprocessor = require('../../lib/proto-preprocessor.js');

/* eslint-env jest */

describe('round trip JSON comparison subsets', () => {
  let sampleJson;

  beforeEach(() => {
    sampleJson = JSON.parse(preprocessor.processForProto(sample));
  });

  it('has the same audit results sans details', () => {
    Object.keys(sampleJson.audits).forEach(audit => {
      delete sampleJson.audits[audit].details;
    });

    expect(roundTripJson.audits).toMatchObject(sampleJson.audits);
  });

  it('has the same audit results & details if applicable', () => {
    Object.keys(sampleJson.audits).forEach(auditId => {
      expect(roundTripJson.audits[auditId]).toMatchObject(sampleJson.audits[auditId]);

      if ('details' in sampleJson.audits[auditId]) {
        expect(roundTripJson.audits[auditId].details)
          .toMatchObject(sampleJson.audits[auditId].details);
      }
    });
  });

  it('has the same i18n rendererFormattedStrings', () => {
    expect(roundTripJson.i18n).toMatchObject(sampleJson.i18n);
  });

  it('has the same top level values', () => {
    Object.keys(sampleJson).forEach(audit => {
      if (typeof sampleJson[audit] === 'object' && !Array.isArray(sampleJson[audit])) {
        delete sampleJson[audit];
      }
    });

    expect(roundTripJson).toMatchObject(sampleJson);
  });

  it('has the same config values', () => {
    expect(roundTripJson.configSettings).toMatchObject(sampleJson.configSettings);
  });
});

// Note: In a failing diff, if you see details.summary going from {} to null, it's OK.
// Jest considers this not a failure, and neither do we, here in the python roundtrip
// Meanwhile, The PSI roundtrip maintains {} to {}.
describe('round trip JSON comparison to everything', () => {
  let sampleJson;

  beforeEach(() => {
    sampleJson = JSON.parse(preprocessor.processForProto(sample));
  });

  it('has the same JSON overall', () => {
    expect(roundTripJson).toMatchObject(sampleJson);
  });
});
