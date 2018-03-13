/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env mocha, browser */

const assert = require('assert');
const fs = require('fs');
const jsdom = require('jsdom');
const Util = require('../../../../report/v2/renderer/util.js');
const URL = require('../../../../lib/url-shim');
const DOM = require('../../../../report/v2/renderer/dom.js');
const DetailsRenderer = require('../../../../report/v2/renderer/details-renderer.js');
const CriticalRequestChainRenderer = require(
    '../../../../report/v2/renderer/crc-details-renderer.js');
const CategoryRenderer = require('../../../../report/v2/renderer/category-renderer.js');
const ReportRenderer = require('../../../../report/v2/renderer/report-renderer.js');
const sampleResults = require('../../../results/sample_v2.json');

const TEMPLATE_FILE = fs.readFileSync(__dirname + '/../../../../report/v2/templates.html', 'utf8');

describe('PerfCategoryRenderer', () => {
  let renderer;

  before(() => {
    global.URL = URL;
    global.Util = Util;
    global.CriticalRequestChainRenderer = CriticalRequestChainRenderer;
    global.CategoryRenderer = CategoryRenderer;

    const PerformanceCategoryRenderer =
        require('../../../../report/v2/renderer/performance-category-renderer.js');

    const document = jsdom.jsdom(TEMPLATE_FILE);
    const dom = new DOM(document);
    const detailsRenderer = new DetailsRenderer(dom);
    renderer = new PerformanceCategoryRenderer(dom, detailsRenderer);
    ReportRenderer.smooshAuditResultsIntoCategories(sampleResults.audits,
      sampleResults.reportCategories);
  });

  after(() => {
    global.URL = undefined;
    global.Util = undefined;
    global.CriticalRequestChainRenderer = undefined;
    global.CategoryRenderer = undefined;
  });

  const category = sampleResults.reportCategories.find(cat => cat.id === 'performance');

  it('renders the category header', () => {
    const categoryDOM = renderer.render(category, sampleResults.reportGroups);
    const score = categoryDOM.querySelector('.lh-score');
    const value = categoryDOM.querySelector('.lh-score  > .lh-score__value');
    const title = score.querySelector('.lh-score__title');

    assert.deepEqual(score, score.firstElementChild, 'first child is a score');
    assert.ok(value.classList.contains('lh-score__value--numeric'),
              'category score is numeric');
    assert.equal(value.textContent, Math.round(category.score), 'category score is rounded');
    assert.equal(title.textContent, category.name, 'title is set');
  });

  it('renders the sections', () => {
    const categoryDOM = renderer.render(category, sampleResults.reportGroups);
    const sections = categoryDOM.querySelectorAll('.lh-category > .lh-audit-group');
    assert.equal(sections.length, 4);
  });

  it('renders the metrics', () => {
    const categoryDOM = renderer.render(category, sampleResults.reportGroups);
    const metricsSection = categoryDOM.querySelectorAll('.lh-category > .lh-audit-group')[0];

    const metricAudits = category.audits.filter(audit => audit.group === 'perf-metric');
    const timelineElements = metricsSection.querySelectorAll('.lh-timeline-metric');
    const nontimelineElements = metricsSection.querySelectorAll('.lh-audit');
    assert.equal(timelineElements.length + nontimelineElements.length, metricAudits.length);
  });

  it('renders the failing performance hints', () => {
    const categoryDOM = renderer.render(category, sampleResults.reportGroups);

    const hintAudits = category.audits.filter(audit => audit.group === 'perf-hint' &&
        audit.result.score !== 1.00);
    const hintElements = categoryDOM.querySelectorAll('.lh-perf-hint');
    assert.equal(hintElements.length, hintAudits.length);

    const hintElement = hintElements[0];
    const hintSparklineElement = hintElement.querySelector('.lh-perf-hint__sparkline');
    assert.ok(hintElement.querySelector('.lh-perf-hint__title'), 'did not render title');
    assert.ok(hintSparklineElement, 'did not render sparkline');
    assert.ok(hintElement.querySelector('.lh-perf-hint__stats'), 'did not render stats');
    assert.ok(hintSparklineElement.title, 'did not render tooltip');
  });

  it('renders the performance hints with a debug string', () => {
    const auditWithDebug = {
      score: 0,
      group: 'perf-hint',
      result: {
        rawValue: 100, debugString: 'Yikes!', description: 'Bug',
        helpText: '', score: .32,
        details: {summary: {wastedMs: 3223}},
      },
    };

    const fakeCategory = Object.assign({}, category, {audits: [auditWithDebug]});
    const categoryDOM = renderer.render(fakeCategory, sampleResults.reportGroups);

    const debugEl = categoryDOM.querySelector('.lh-perf-hint .lh-debug');
    assert.ok(debugEl, 'did not render debug');
  });

  it('renders errored performance hint with a debug string', () => {
    const auditWithDebug = {
      score: 0,
      group: 'perf-hint',
      result: {
        error: true, score: 0,
        rawValue: 100, debugString: 'Yikes!!', description: 'Bug #2',

      },
    };

    const fakeCategory = Object.assign({}, category, {audits: [auditWithDebug]});
    const categoryDOM = renderer.render(fakeCategory, sampleResults.reportGroups);

    const debugEl = categoryDOM.querySelector('.lh-perf-hint .lh-debug');
    assert.ok(debugEl, 'did not render debug');
  });

  it('throws if a performance hint is missing summary.wastedMs', () => {
    const auditWithDebug = {
      score: 0,
      group: 'perf-hint',
      result: {
        rawValue: 100, description: 'Bug',
        helpText: '', score: .32,
      },
    };

    const fakeCategory = Object.assign({}, category, {audits: [auditWithDebug]});
    assert.throws(_ => {
      renderer.render(fakeCategory, sampleResults.reportGroups);
    });
  });

  it('renders the failing diagnostics', () => {
    const categoryDOM = renderer.render(category, sampleResults.reportGroups);
    const diagnosticSection = categoryDOM.querySelectorAll('.lh-category > .lh-audit-group')[2];

    const diagnosticAudits = category.audits.filter(audit => audit.group === 'perf-info' &&
        audit.result.score !== 1.00);
    const diagnosticElements = diagnosticSection.querySelectorAll('.lh-audit');
    assert.equal(diagnosticElements.length, diagnosticAudits.length);
  });

  it('renders the passed audits', () => {
    const categoryDOM = renderer.render(category, sampleResults.reportGroups);
    const passedSection = categoryDOM.querySelector('.lh-category > .lh-passed-audits');

    const passedAudits = category.audits.filter(audit =>
        audit.group && audit.group !== 'perf-metric' &&
        audit.result.score === 1);
    const passedElements = passedSection.querySelectorAll('.lh-audit');
    assert.equal(passedElements.length, passedAudits.length);
  });
});
