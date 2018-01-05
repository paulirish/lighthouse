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
        {score: 10, weight: 1},
        {score: 20, weight: 1},
        {score: 3, weight: 1},
      ]), 11);
    });

    it('should work for varying weights', () => {
      assert.equal(ReportScoring.arithmeticMean([
        {score: 10, weight: 2},
        {score: 0, weight: 7},
        {score: 20, weight: 1},
      ]), 4);
    });

    it('should work for missing values', () => {
      assert.equal(ReportScoring.arithmeticMean([
        {weight: 1},
        {score: 30, weight: 1},
        {weight: 1},
        {score: 100},
      ]), 10);
    });
  });

  describe('#scoreAllCategories', () => {
    it('should return a score', () => {
      const result = ReportScoring.scoreAllCategories({
        categories: {
          'categoryA': {weight: 1, audits: [{id: 'auditA', weight: 1}]},
          'categoryB': {weight: 4, audits: [{id: 'auditB', weight: 1}]},
          'categoryC': {audits: []},
        },
      }, {auditA: {score: 50}, auditB: {score: 100}});

      assert.equal(result.score, 90);
    });

    it('should return categories', () => {
      const result = ReportScoring.scoreAllCategories({
        categories: {
          'my-category': {name: 'My Category', audits: []},
          'my-other-category': {description: 'It is a nice category', audits: []},
        },
      }, {});

      assert.equal(result.categories.length, 2);
      assert.equal(result.categories[0].name, 'My Category');
      assert.equal(result.categories[1].description, 'It is a nice category');
    });

    it('should score the categories', () => {
      const resultsByAuditId = {
        'my-audit': {rawValue: 'you passed'},
        'my-boolean-audit': {score: true, extendedInfo: {}},
        'my-scored-audit': {score: 100},
        'my-failed-audit': {score: 20},
        'my-boolean-failed-audit': {score: false},
      };

      const result = ReportScoring.scoreAllCategories({
        categories: {
          'my-category': {audits: [{id: 'my-audit'}]},
          'my-scored': {
            audits: [
              {id: 'my-boolean-audit', weight: 1},
              {id: 'my-scored-audit', weight: 1},
              {id: 'my-failed-audit', weight: 1},
              {id: 'my-boolean-failed-audit', weight: 1},
            ],
          },
        },
      }, resultsByAuditId);

      assert.equal(result.categories.length, 2);
      assert.equal(result.categories[0].score, 0);
      assert.equal(result.categories[1].score, 55);
    });
  });
});
