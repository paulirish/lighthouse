/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const assert = require('assert');
const fs = require('fs');
const jsdom = require('jsdom');
const Util = require('../../../../report/html/renderer/util.js');
const URL = require('../../../../lib/url-shim');
const DOM = require('../../../../report/html/renderer/dom.js');
const DetailsRenderer = require('../../../../report/html/renderer/details-renderer.js');
const ReportUIFeatures = require('../../../../report/html/renderer/report-ui-features.js');
const CategoryRenderer = require('../../../../report/html/renderer/category-renderer.js');
const CriticalRequestChainRenderer = require(
    '../../../../report/html/renderer/crc-details-renderer.js');
const ReportRenderer = require('../../../../report/html/renderer/report-renderer.js');
const sampleResultsOrig = require('../../../results/sample_v2.json');

const TIMESTAMP_REGEX = /\d+, \d{4}.*\d+:\d+/;
const TEMPLATE_FILE = fs.readFileSync(__dirname +
    '/../../../../report/html/templates.html', 'utf8');

describe('ReportRenderer', () => {
  let renderer;
  let sampleResults;

  beforeAll(() => {
    global.URL = URL;
    global.Util = Util;
    global.ReportUIFeatures = ReportUIFeatures;
    global.CriticalRequestChainRenderer = CriticalRequestChainRenderer;
    global.DetailsRenderer = DetailsRenderer;
    global.CategoryRenderer = CategoryRenderer;

    // lazy loaded because they depend on CategoryRenderer to be available globally
    global.PerformanceCategoryRenderer =
        require('../../../../report/html/renderer/performance-category-renderer.js');
    global.PwaCategoryRenderer =
        require('../../../../report/html/renderer/pwa-category-renderer.js');

    // Stub out matchMedia for Node.
    global.matchMedia = function() {
      return {
        addListener: function() {},
      };
    };

    const {window} = new jsdom.JSDOM(TEMPLATE_FILE);
    global.self = window;

    const dom = new DOM(window.document);
    const detailsRenderer = new DetailsRenderer(dom);
    const categoryRenderer = new CategoryRenderer(dom, detailsRenderer);
    renderer = new ReportRenderer(dom, categoryRenderer);
    sampleResults = Util.prepareReportResult(sampleResultsOrig);
  });

  afterAll(() => {
    global.self = undefined;
    global.URL = undefined;
    global.Util = undefined;
    global.ReportUIFeatures = undefined;
    global.matchMedia = undefined;
    global.CriticalRequestChainRenderer = undefined;
    global.DetailsRenderer = undefined;
    global.CategoryRenderer = undefined;
    global.PerformanceCategoryRenderer = undefined;
    global.PwaCategoryRenderer = undefined;
  });

  describe('renderReport', () => {
    it('should render a report', () => {
      const container = renderer._dom._document.body;
      const output = renderer.renderReport(sampleResults, container);
      assert.ok(output.querySelector('.lh-header-sticky'), 'has a header');
      assert.ok(output.querySelector('.lh-report'), 'has report body');
      assert.equal(output.querySelectorAll('.lh-gauge__wrapper, .lh-gauge--pwa__wrapper').length,
          sampleResults.reportCategories.length * 2, 'renders category gauges');
      // no fireworks
      assert.ok(output.querySelector('.score100') === null, 'has no fireworks treatment');
    });

    it('renders additional reports by replacing the existing one', () => {
      const container = renderer._dom._document.body;
      const oldReport = Array.from(renderer.renderReport(sampleResults, container).children);
      const newReport = Array.from(renderer.renderReport(sampleResults, container).children);
      assert.ok(!oldReport.find(node => container.contains(node)), 'old report was removed');
      assert.ok(newReport.find(node => container.contains(node)),
        'new report appended to container');
    });

    it('renders a header', () => {
      const header = renderer._renderReportHeader(sampleResults);
      assert.ok(header.querySelector('.lh-export'), 'contains export button');

      assert.ok(header.querySelector('.lh-config__timestamp').textContent.match(TIMESTAMP_REGEX),
          'formats the generated datetime');
      assert.equal(header.querySelector('.lh-metadata__url').textContent, sampleResults.finalUrl);
      const url = header.querySelector('.lh-metadata__url');
      assert.equal(url.textContent, sampleResults.finalUrl);
      assert.equal(url.href, sampleResults.finalUrl);
    });

    it('renders special score gauges after the mainstream ones', () => {
      const container = renderer._dom._document.body;
      const output = renderer.renderReport(sampleResults, container);

      const allGaugeCount = output
        .querySelectorAll('.lh-scores-header > a[class*="lh-gauge"]').length;
      const regularGaugeCount = output
        .querySelectorAll('.lh-scores-header > .lh-gauge__wrapper').length;

      // Not all gauges are regular.
      assert.ok(regularGaugeCount < allGaugeCount);

      const scoresHeaderElem = output.querySelector('.lh-scores-header');
      for (let i = 0; i < scoresHeaderElem.children.length; i++) {
        const gauge = scoresHeaderElem.children[i];

        if (i < regularGaugeCount) {
          assert.ok(gauge.classList.contains('lh-gauge__wrapper'));
        } else {
          assert.ok(!gauge.classList.contains('lh-gauge__wrapper'));
          assert.ok(gauge.classList.contains('lh-gauge--pwa__wrapper'));
        }
      }
    });

    it('should not mutate a report object', () => {
      const container = renderer._dom._document.body;
      const originalResults = JSON.parse(JSON.stringify(sampleResults));
      renderer.renderReport(sampleResults, container);
      assert.deepStrictEqual(sampleResults, originalResults);
    }, 2000);

    it('renders no warning section when no lighthouseRunWarnings occur', () => {
      const warningResults = Object.assign({}, sampleResults, {runWarnings: []});
      const container = renderer._dom._document.body;
      const output = renderer.renderReport(warningResults, container);
      assert.strictEqual(output.querySelector('.lh-warnings--toplevel'), null);
    });

    it('renders a warning section', () => {
      const container = renderer._dom._document.body;
      const output = renderer.renderReport(sampleResults, container);

      const warningEls = output.querySelectorAll('.lh-warnings--toplevel > ul > li');
      assert.strictEqual(warningEls.length, sampleResults.runWarnings.length);
    });

    it('renders a footer', () => {
      const footer = renderer._renderReportFooter(sampleResults);
      const footerContent = footer.querySelector('.lh-footer').textContent;
      assert.ok(/Generated by Lighthouse \d/.test(footerContent), 'includes lh version');
      assert.ok(footerContent.match(TIMESTAMP_REGEX), 'includes timestamp');

      // Check runtime settings were populated.
      const names = Array.from(footer.querySelectorAll('.lh-env__name'));
      const descriptions = Array.from(footer.querySelectorAll('.lh-env__description'));
      assert.ok(names.length >= 3);
      assert.ok(descriptions.length >= 3);

      const descriptionsTxt = descriptions.map(el => el.textContent).join('\n');
      assert.ok(/Nexus/.test(descriptionsTxt), 'should have added device emulation');
      assert.ok(/RTT/.test(descriptionsTxt), 'should have added network');
      assert.ok(/\dx/.test(descriptionsTxt), 'should have added CPU');
      assert.ok(descriptionsTxt.includes(sampleResults.userAgent), 'user agent populated');
    });
  });

  it('can set a custom templateContext', () => {
    assert.equal(renderer._templateContext, renderer._dom.document());

    const {window} = new jsdom.JSDOM(TEMPLATE_FILE);
    const otherDocument = window.document;
    renderer.setTemplateContext(otherDocument);
    assert.equal(renderer._templateContext, otherDocument);
  });

  it('should render an all 100 report with fireworks', () => {
    const container = renderer._dom._document.body;

    sampleResults.reportCategories.forEach(element => {
      element.score = 1;
    });

    const output = renderer.renderReport(sampleResults, container);
    // standard checks
    assert.ok(output.querySelector('.lh-header-sticky'), 'has a header');
    assert.ok(output.querySelector('.lh-report'), 'has report body');
    assert.equal(output.querySelectorAll('.lh-gauge__wrapper, .lh-gauge--pwa__wrapper').length,
        sampleResults.reportCategories.length * 2, 'renders category gauges');
    // fireworks!
    assert.ok(output.querySelector('.score100'), 'has fireworks treatment');
  });

  it('renders `not_applicable` audits as `notApplicable`', () => {
    const clonedSampleResult = JSON.parse(JSON.stringify(sampleResultsOrig));

    let notApplicableCount = 0;
    Object.values(clonedSampleResult.audits).forEach(audit => {
      if (audit.scoreDisplayMode === 'notApplicable') {
        notApplicableCount++;
        audit.scoreDisplayMode = 'not_applicable';
      }
    });

    assert.ok(notApplicableCount > 20); // Make sure something's being tested.

    const container = renderer._dom._document.body;
    const reportElement = renderer.renderReport(sampleResults, container);
    const notApplicableElementCount = reportElement
      .querySelectorAll('.lh-audit--notapplicable').length;
    assert.strictEqual(notApplicableCount, notApplicableElementCount);
  });
});
