/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const assert = require('assert');
const jsdom = require('jsdom');
const DOM = require('../../report/html/renderer/dom.js');
const pageFunctions = require('../../lib/page-functions');

/* eslint-env jest */

describe('Page Functions', () => {
  let dom;

  beforeAll(() => {
    const {document} = new jsdom.JSDOM().window;
    dom = new DOM(document);
  });

  describe('get outer HTML snippets', () => {
    it('gets full HTML snippet', () => {
      assert.equal(pageFunctions.getOuterHTMLSnippet(
        dom.createElement('div', '', {id: '1', style: 'style'})), '<div id="1" style="style">');
    });

    it('removes a specific attribute', () => {
      assert.equal(pageFunctions.getOuterHTMLSnippet(
        dom.createElement('div', '', {id: '1', style: 'style'}), ['style']), '<div id="1">');
    });

    it('removes multiple attributes', () => {
      assert.equal(pageFunctions.getOuterHTMLSnippet(
        dom.createElement('div', '', {'id': '1', 'style': 'style', 'aria-label': 'label'}),
        ['style', 'aria-label']
      ), '<div id="1">');
    });

    it('ignores when attribute not found', () => {
      assert.equal(pageFunctions.getOuterHTMLSnippet(
        dom.createElement('div', '', {'id': '1', 'style': 'style', 'aria-label': 'label'}),
        ['style-missing', 'aria-label-missing']
      ), '<div id="1" style="style" aria-label="label">');
    });

    it('works if attribute values contain line breaks', () => {
      assert.equal(pageFunctions.getOuterHTMLSnippet(
        dom.createElement('div', '', {style: 'style1\nstyle2'})), '<div style="style1\nstyle2">');
    });
  });

  describe('getNodeSelector', () => {
    it('Uses IDs where available and otherwise falls back to classes', () => {
      const parentEl = dom.createElement('div', '', {id: 'wrapper', class: 'dont-use-this'});
      const childEl = dom.createElement('div', '', {class: 'child'});
      parentEl.appendChild(childEl);
      assert.equal(pageFunctions.getNodeSelector(childEl), 'div#wrapper > div.child');
    });
  });
});
