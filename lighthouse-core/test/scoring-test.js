/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const assert = require('assert');
const ReportScoring = require('../scoring');

/* eslint-env mocha */
describe('ReportScoring', () => {
  describe('#arithmeticMean', () => {
    it('should work for empty list', () => {
      assert.equal(ReportScoring.arithmeticMean([]), 0);
    });

    it('should work for equal weights', () => {
      assert.equal(ReportScoring.arithmeticMean([
        {score: .10, weight: 1},
        {score: .20, weight: 1},
        {score: .03, weight: 1},
      ]), .11);
    });

    it('should work for varying weights', () => {
      assert.equal(ReportScoring.arithmeticMean([
        {score: .10, weight: 2},
        {score: .00, weight: 7},
        {score: .20, weight: 1},
      ]), .04);
    });

    it('should work for missing values', () => {
      assert.equal(ReportScoring.arithmeticMean([
        {weight: 1},
        {score: .30, weight: 1},
        {weight: 1},
        {score: 1.00},
      ]), .10);
    });
  });

  describe('#scoreAllCategories', () => {
    it('should score the categories', () => {
      const resultsByAuditId = {
        'my-audit': {rawValue: 'you passed', score: 0},
        'my-boolean-audit': {score: 1.00, extendedInfo: {}},
        'my-scored-audit': {score: 1.00},
        'my-failed-audit': {score: .20},
        'my-boolean-failed-audit': {score: 0},
      };

      const result = {
        categories: {
          categoryA: {audits: [{id: 'my-audit'}]},
          categoryB: {
            audits: [
              {id: 'my-boolean-audit', weight: 1},
              {id: 'my-scored-audit', weight: 1},
              {id: 'my-failed-audit', weight: 1},
              {id: 'my-boolean-failed-audit', weight: 1},
            ],
          },
        },
      };

      ReportScoring.scoreAllCategories(result, resultsByAuditId);

      assert.equal(result.categories.categoryA.score, 0);
      assert.equal(result.categories.categoryB.score, .55);
    });
  });
});
