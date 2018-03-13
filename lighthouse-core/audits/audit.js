/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
// @ts-nocheck
'use strict';

const statistics = require('../lib/statistics');

const DEFAULT_PASS = 'defaultPass';

/**
 * Clamp figure to 2 decimal places
 * @param {number} val
 * @return {number}
 */
const clampTo2Decimals = val => Math.round(val * 100) / 100;

class Audit {
  /**
   * @return {!string}
   */
  static get DEFAULT_PASS() {
    return DEFAULT_PASS;
  }

  /**
   * @return {{NUMERIC: string, BINARY: string}}
   */
  static get SCORING_MODES() {
    return {
      NUMERIC: 'numeric',
      BINARY: 'binary',
    };
  }

  /**
   * @throws {Error}
   */
  static get meta() {
    throw new Error('Audit meta information must be overridden.');
  }

  /**
   * Computes a clamped score between 0 and 100 based on the measured value. Score is determined by
   * considering a log-normal distribution governed by the two control points, point of diminishing
   * returns and the median value, and returning the percentage of sites that have higher value.
   *
   * @param {number} measuredValue
   * @param {number} diminishingReturnsValue
   * @param {number} medianValue
   * @return {number}
   */
  static computeLogNormalScore(measuredValue, diminishingReturnsValue, medianValue) {
    const distribution = statistics.getLogNormalDistribution(
      medianValue,
      diminishingReturnsValue
    );

    let score = distribution.computeComplementaryPercentile(measuredValue);
    score = Math.min(1, score);
    score = Math.max(0, score);
    return Math.round(score * 100) / 100;
  }

  /**
   * @param {!Audit} audit
   * @param {string} debugString
   * @return {!AuditFullResult}
   */
  static generateErrorAuditResult(audit, debugString) {
    return Audit.generateAuditResult(audit, {
      rawValue: null,
      error: true,
      debugString,
    });
  }

  /**
   * @param {!Audit.Headings} headings
   * @param {!Array<!Object<string, string>>} results
   * @param {!DetailsRenderer.DetailsSummary} summary
   * @return {!DetailsRenderer.DetailsJSON}
   */
  static makeTableDetails(headings, results, summary) {
    if (results.length === 0) {
      return {
        type: 'table',
        headings: [],
        items: [],
        summary,
      };
    }

    return {
      type: 'table',
      headings: headings,
      items: results,
      summary,
    };
  }

  /**
   * @param {!Audit} audit
   * @param {!AuditResult} result
   * @return {{score: number, scoreDisplayMode: string, informative: boolean, rawValue: boolean}}
   */
  static _normalizeAuditScore(audit, result) {
    let score = typeof result.score === 'undefined' ? result.rawValue : result.score;
    let informative;
    let rawValue;

    if (typeof score === 'boolean' || score === null) {
      score = score ? 1 : 0;
    } else {
      score = clampTo2Decimals(score);
    }

    // If the audit was determined to not apply to the page, we'll reset it as informative only
    if (result.notApplicable) {
      score = 1;
      rawValue = true;
      informative = true;
    }

    if (!Number.isFinite(score)) throw new Error(`Invalid score: ${score}`);
    if (score > 1) throw new Error(`Audit score for ${audit.meta.name} is > 1`);

    const scoreDisplayMode = audit.meta.scoreDisplayMode || Audit.SCORING_MODES.BINARY;

    return {
      score,
      scoreDisplayMode,
      informative,
      rawValue,
    };
  }

  /**
   * @param {!Audit} audit
   * @param {!AuditResult} result
   * @return {!AuditFullResult}
   */
  static generateAuditResult(audit, result) {
    if (typeof result.rawValue === 'undefined') {
      throw new Error('generateAuditResult requires a rawValue');
    }

    const {score, scoreDisplayMode, informative, rawValue} = Audit._normalizeAuditScore(audit,
        result);

    const displayValue = result.displayValue ? `${result.displayValue}` : '';

    let auditDescription = audit.meta.description;
    if (audit.meta.failureDescription) {
      if (score < 1) {
        auditDescription = audit.meta.failureDescription;
      }
    }

    return {
      score,
      displayValue,
      rawValue: rawValue || result.rawValue,
      error: result.error,
      debugString: result.debugString,
      extendedInfo: result.extendedInfo,
      scoreDisplayMode,
      informative: audit.meta.informative || informative,
      manual: audit.meta.manual,
      notApplicable: result.notApplicable,
      name: audit.meta.name,
      description: auditDescription,
      helpText: audit.meta.helpText,
      details: result.details,
    };
  }
}

module.exports = Audit;

/**
 * @typedef {Object} Audit.Heading
 * @property {string} key
 * @property {string} itemType
 * @property {string} text
 */

/**
 * @typedef {Array<Audit.Heading>} Audit.Headings
 */

/**
 * @typedef {Object} Audit.HeadingsResult
 * @property {number} results
 * @property {Audit.Headings} headings
 * @property {boolean} passes
 * @property {string=} debugString
 */
