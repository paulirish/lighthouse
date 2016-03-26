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
const Audit = require('../../../audits/html/theme-color.js');
const assert = require('assert');
const mockHtml = require('../../helpers/mock-html.js');

/* global describe, it*/

describe('HTML: theme-color audit', () => {
  it('fails when no window or html present', () => {
    return assert.equal(Audit.audit({}).value, false);
  });

  it('fails when invalid HTML and window given', () => {
    return assert.equal(Audit.audit({
      window: null,
      html: null
    }).value, false);
  });

  it('fails when no theme-color is present in the html', () => {
    return assert.equal(Audit.audit(mockHtml()).value, false);
  });

  it('fails when theme-color has no content value', () => {
    return assert.equal(Audit.audit(
      mockHtml('<meta name="theme-color" content="">')).value, false);
  });

  it('fails when multiple theme-colors exist', () => {
    return assert.equal(Audit.audit(
      mockHtml(`<meta name="theme-color" content="#ffffff">
        <meta name="theme-color" content="#ffffff">`)).value, false);
  });

  it('fails when theme-color exists in the body', () => {
    return assert.equal(Audit.audit(
      mockHtml('', '<meta name="theme-color" content="#ffffff">')
    ).value, false);
  });

  it('succeeds when theme-color present in the html', () => {
    return assert.equal(Audit.audit(
      mockHtml('<meta name="theme-color" content="#ffffff">')
    ).value, true);
  });

  it('succeeds when theme-color present in the html with id', () => {
    return assert.equal(Audit.audit(
      mockHtml('<meta id="my-theme-color" name="theme-color" content="#ffffff">')
    ).value, true);
  });

  it('succeeds when theme-color has a CSS name content value', () => {
    return assert.equal(Audit.audit(
      mockHtml('<meta id="my-theme-color" name="theme-color" content="red">')
    ).value, true);
  });
});
