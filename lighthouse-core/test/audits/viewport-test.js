/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('../../audits/viewport.js');
const assert = require('assert');

/* eslint-env jest */

describe('Mobile-friendly: viewport audit', () => {
  const makeMetaElements = viewport => [{name: 'viewport', content: viewport}];

  it('fails when HTML does not contain a viewport meta tag', () => {
    return assert.equal(Audit.audit({
      MetaElements: [],
    }).rawValue, false);
  });

  it('fails when HTML contains a non-mobile friendly viewport meta tag', () => {
    const viewport = 'maximum-scale=1';
    assert.equal(Audit.audit({MetaElements: makeMetaElements(viewport)}).rawValue, false);
    assert.equal(Audit.audit({
      MetaElements: makeMetaElements(viewport),
    }).warnings[0], undefined);
  });

  it('fails when HTML contains an invalid viewport meta tag key', () => {
    const viewport = 'nonsense=true';
    assert.equal(Audit.audit({MetaElements: makeMetaElements(viewport)}).rawValue, false);
    assert.equal(Audit.audit({
      MetaElements: makeMetaElements(viewport),
    }).warnings[0], 'Invalid properties found: {"nonsense":"true"}');
  });

  it('fails when HTML contains an invalid viewport meta tag value', () => {
    const viewport = 'initial-scale=microscopic';
    assert.equal(Audit.audit({MetaElements: makeMetaElements(viewport)}).rawValue, false);
    assert.equal(Audit.audit({
      MetaElements: makeMetaElements(viewport),
    }).warnings[0], 'Invalid values found: {"initial-scale":"microscopic"}');
  });

  it('fails when HTML contains an invalid viewport meta tag key and value', () => {
    const viewport = 'nonsense=true, initial-scale=microscopic';
    const {rawValue, warnings} = Audit.audit({MetaElements: makeMetaElements(viewport)});
    assert.equal(rawValue, false);
    assert.equal(warnings[0], 'Invalid properties found: {"nonsense":"true"}');
    assert.equal(warnings[1], 'Invalid values found: {"initial-scale":"microscopic"}');
  });

  it('passes when a valid viewport is provided', () => {
    const viewports = [
      'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1',
      'width = device-width, initial-scale = 1',
      'initial-scale=1',
      'width=device-width     ',
    ];
    viewports.forEach(viewport => {
      assert.equal(Audit.audit({
        MetaElements: makeMetaElements(viewport),
      }).rawValue, true);
    });
  });

  it('doesn\'t throw when viewport contains "invalid" iOS properties', () => {
    const viewports = [
      'width=device-width, shrink-to-fit=no',
      'width=device-width, viewport-fit=cover',
    ];
    viewports.forEach(viewport => {
      const result = Audit.audit({MetaElements: makeMetaElements(viewport)});
      assert.equal(result.rawValue, true);
      assert.equal(result.warnings[0], undefined);
    });
  });
});
