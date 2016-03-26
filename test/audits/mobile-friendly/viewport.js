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
const Audit = require('../../../audits/mobile-friendly/viewport.js');
const assert = require('assert');
const mockHtml = require('../../helpers/mock-html.js');

/* global describe, it*/

// Need to disable camelcase check for dealing with background_color.
/* eslint-disable camelcase */
describe('Mobile-friendly: viewport audit', () => {
  it('fails when no input present', () => {
    return assert.equal(Audit.audit({}).value, false);
  });

  it('fails when invalid HTML and window given', () => {
    return assert.equal(Audit.audit({
      window: null,
      html: null
    }).value, false);
  });

  it('fails when HTML does not contain a viewport meta tag', () => {
    return assert.equal(Audit.audit(mockHtml()).value, false);
  });

  it('fails when a viewport is in the body', () => {
    return assert.equal(Audit.audit(
      mockHtml('', '<meta name="viewport" content="width=device-width">')
    ).value, false);
  });

  it('fails when multiple viewports defined', () => {
    return assert.equal(Audit.audit(
      mockHtml(`<meta name="viewport" content="width=device-width">
      <meta name="viewport" content="width=device-width">`)
    ).value, false);
  });

  it('passes when a viewport is provided', () => {
    return assert.equal(Audit.audit(
      mockHtml('<meta name="viewport" content="width=device-width">')
    ).value, true);
  });

  it('passes when a viewport is provided with an id', () => {
    return assert.equal(Audit.audit(
      mockHtml('<meta id="my-viewport" name="viewport" content="width=device-width">')
    ).value, true);
  });
});
/* eslint-enable */
