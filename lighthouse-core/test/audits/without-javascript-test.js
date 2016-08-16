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
const Audit = require('../../audits/without-javascript.js');
const assert = require('assert');

/* global describe, it*/

/* eslint-disable no-script-url */
describe('JavaScript: scripting audit', () => {
  it('fails when the js-less body is empty', () => {
    return assert.equal(Audit.audit({HTMLWithoutJavaScript: ''}).score, false);
  });
  it('fails when the js-less body is whitespace', () => {
    return assert.equal(Audit.audit({HTMLWithoutJavaScript: '        '}).score, false);
  });
  it('succeeds when the js-less body contains some content', () => {
    return assert.equal(Audit.audit({HTMLWithoutJavaScript: 'test'}).score, true);
  });
});
/* eslint-enable */
