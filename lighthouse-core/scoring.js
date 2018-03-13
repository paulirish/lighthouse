/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

'use strict';

/**
 * Clamp figure to 2 decimal places
 * @param {number} val
 * @return {number}
 */
const clampTo2Decimals = val => Math.round(val * 100) / 100;

class ReportScoring {
  /**
   * Computes the weighted-average of the score of the list of items.
   * @param {!Array<{score: number, weight: number|undefined}>} items
   * @return {number}
   */
  static arithmeticMean(items) {
    const results = items.reduce(
      (result, item) => {
        const score = Number(item.score) || 0;
        const weight = Number(item.weight) || 0;
        return {
          weight: result.weight + weight,
          sum: result.sum + score * weight,
        };
      },
      {weight: 0, sum: 0}
    );

    return clampTo2Decimals(results.sum / results.weight || 0);
  }

  /**
   * Returns the report JSON object with computed scores.
   * @param {{categories: !Object<string, {id: string|undefined, weight: number|undefined, score: number|undefined, audits: !Array<{id: string, weight: number|undefined}>}>}} config
   * @param {!Object<string, {score: number, notApplicable: boolean, informative: boolean}>} resultsByAuditId
   */
  static scoreAllCategories(config, resultsByAuditId) {
    for (const [categoryId, category] of Object.entries(config.categories)) {
      category.id = categoryId;
      category.audits.forEach(audit => {
        const result = resultsByAuditId[audit.id];
        // If a result was not applicable, meaning its checks did not run against anything on
        // the page, force it's weight to 0. It will not count during the arithmeticMean() but
        // will still be included in the final report json and displayed in the report as
        // "Not Applicable".
        if (result.notApplicable) {
          audit.weight = 0;
        }
      });

      const scores = category.audits.map(audit => ({
        score: resultsByAuditId[audit.id].score,
        weight: audit.weight,
      }));
      const categoryScore = ReportScoring.arithmeticMean(scores);
      // mutate config.categories[].score
      category.score = categoryScore;
    }
  }
}

module.exports = ReportScoring;
