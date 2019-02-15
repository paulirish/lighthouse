/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const FontSizeAudit = require('../../../audits/seo/font-size.js');
const assert = require('assert');

const URL = 'https://example.com';
const validViewport = 'width=device-width';

/* eslint-env jest */

describe('SEO: Font size audit', () => {
  const makeMetaElements = viewport => [{name: 'viewport', content: viewport}];

  it('fails when viewport is not set', () => {
    const artifacts = {
      URL,
      MetaElements: [],
      FontSize: [],
    };

    const auditResult = FontSizeAudit.audit(artifacts);
    assert.equal(auditResult.rawValue, false);
    expect(auditResult.explanation)
      .toBeDisplayString('Text is illegible because there\'s ' +
        'no viewport meta tag optimized for mobile screens.');
  });

  it('fails when less than 60% of text is legible', () => {
    const artifacts = {
      URL,
      MetaElements: makeMetaElements(validViewport),
      FontSize: {
        totalTextLength: 100,
        visitedTextLength: 100,
        failingTextLength: 41,
        analyzedFailingTextLength: 41,
        analyzedFailingNodesData: [
          {textLength: 10, fontSize: 10, node: {nodeId: 1, localName: 'p', attributes: []}},
          {textLength: 31, fontSize: 11, node: {nodeId: 2, localName: 'p', attributes: []}},
        ],
      },
    };

    const auditResult = FontSizeAudit.audit(artifacts);
    assert.equal(auditResult.rawValue, false);
    expect(auditResult.explanation).toBeDisplayString('41% of text is too small.');
    expect(auditResult.displayValue).toBeDisplayString('59% legible text');
  });

  it('passes when there is no text', () => {
    const artifacts = {
      URL,
      MetaElements: makeMetaElements(validViewport),
      FontSize: {
        totalTextLength: 0,
        visitedTextLength: 0,
        failingTextLength: 0,
        analyzedFailingTextLength: 0,
        analyzedFailingNodesData: [
          {textLength: 0, fontSize: 11, node: {nodeId: 1, localName: 'p', attributes: []}},
        ],
      },
    };

    const auditResult = FontSizeAudit.audit(artifacts);
    assert.equal(auditResult.rawValue, true);
  });

  it('passes when more than 60% of text is legible', () => {
    const artifacts = {
      URL,
      MetaElements: makeMetaElements(validViewport),
      FontSize: {
        totalTextLength: 330,
        visitedTextLength: 330,
        failingTextLength: 33,
        analyzedFailingTextLength: 33,
        analyzedFailingNodesData: [
          {textLength: 11, fontSize: 10, node: {nodeId: 1, localName: 'p', attributes: []}},
          {textLength: 22, fontSize: 11, node: {nodeId: 2, localName: 'p', attributes: []}},
        ],
      },
    };
    const auditResult = FontSizeAudit.audit(artifacts);
    assert.equal(auditResult.rawValue, true);
    expect(auditResult.displayValue).toBeDisplayString('90% legible text');
  });

  it('groups entries with same source, sorts them by coverage', () => {
    const style1 = {
      styleSheetId: 1,
      type: 'Regular',
      range: {
        startLine: 123,
        startColumn: 10,
      },
    };
    const style2 = {
      styleSheetId: 1,
      type: 'Regular',
      range: {
        startLine: 0,
        startColumn: 10,
      },
    };
    const artifacts = {
      URL,
      MetaElements: makeMetaElements(validViewport),
      FontSize: {
        totalTextLength: 7,
        visitedTextLength: 7,
        failingTextLength: 7,
        analyzedFailingTextLength: 7,
        analyzedFailingNodesData: [
          {textLength: 3, fontSize: 11, node: {nodeId: 1}, cssRule: style1},
          {textLength: 2, fontSize: 10, node: {nodeId: 2}, cssRule: style2},
          {textLength: 2, fontSize: 10, node: {nodeId: 3}, cssRule: style2},
        ],
      },
    };
    const auditResult = FontSizeAudit.audit(artifacts);

    assert.equal(auditResult.rawValue, false);
    assert.equal(auditResult.details.items.length, 2);
    assert.equal(auditResult.details.items[0].coverage, '57.14%');
    expect(auditResult.displayValue).toBeDisplayString('0% legible text');
  });

  it('adds a category for failing text that wasn\'t analyzed', () => {
    const artifacts = {
      URL,
      MetaElements: makeMetaElements(validViewport),
      FontSize: {
        totalTextLength: 100,
        visitedTextLength: 100,
        failingTextLength: 50,
        analyzedFailingTextLength: 10,
        analyzedFailingNodesData: [
          {textLength: 10, fontSize: 10, node: {nodeId: 1, localName: 'p', attributes: []}},
        ],
      },
    };
    const auditResult = FontSizeAudit.audit(artifacts);
    assert.equal(auditResult.rawValue, false);
    assert.equal(auditResult.details.items.length, 3);
    assert.equal(auditResult.details.items[1].source, 'Add\'l illegible text');
    assert.equal(auditResult.details.items[1].coverage, '40.00%');
    expect(auditResult.displayValue).toBeDisplayString('50% legible text');
  });

  it('informs user if audit haven\'t covered all text on the page', () => {
    const artifacts = {
      URL,
      MetaElements: makeMetaElements(validViewport),
      FontSize: {
        totalTextLength: 100,
        visitedTextLength: 50,
        failingTextLength: 50,
        analyzedFailingTextLength: 50,
        analyzedFailingNodesData: [
          {textLength: 50, fontSize: 10, node: {nodeId: 1, localName: 'p', attributes: []}},
        ],
      },
    };
    const auditResult = FontSizeAudit.audit(artifacts);
    assert.equal(auditResult.rawValue, false);
    expect(auditResult.explanation)
      .toBeDisplayString('100% of text is too small (based on 50% sample).');
    expect(auditResult.displayValue).toBeDisplayString('0% legible text');
  });

  it('maintains 2 trailing decimal places', () => {
    const artifacts = {
      URL,
      MetaElements: makeMetaElements(validViewport),
      FontSize: {
        totalTextLength: 323,
        visitedTextLength: 323,
        failingTextLength: 33,
        analyzedFailingTextLength: 33,
        analyzedFailingNodesData: [
          {textLength: 11, fontSize: 10, node: {nodeId: 1, localName: 'p', attributes: []}},
          {textLength: 22, fontSize: 11, node: {nodeId: 2, localName: 'p', attributes: []}},
        ],
      },
    };
    const auditResult = FontSizeAudit.audit(artifacts);
    expect(auditResult.displayValue).toBeDisplayString('89.78% legible text');
  });

  it('maintains 2 trailing decimal places with only 1 leading digit', () => {
    const artifacts = {
      URL,
      MetaElements: makeMetaElements(validViewport),
      FontSize: {
        totalTextLength: 323,
        visitedTextLength: 323,
        failingTextLength: 315,
        analyzedFailingTextLength: 315,
        analyzedFailingNodesData: [
          {textLength: 311, fontSize: 10, node: {nodeId: 1, localName: 'p', attributes: []}},
          {textLength: 4, fontSize: 11, node: {nodeId: 2, localName: 'p', attributes: []}},
        ],
      },
    };
    const auditResult = FontSizeAudit.audit(artifacts);
    expect(auditResult.displayValue).toBeDisplayString('2.48% legible text');
  });
});
