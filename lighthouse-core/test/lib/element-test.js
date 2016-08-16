/**
 * @license
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

'use strict';

const Element = require('../../lib/element');
const assert = require('assert');

class DriverStub {
  sendCommand() {
    return Promise.resolve({attributes: ['rel', 'manifest']});
  }
}

/* global describe, it, beforeEach */
describe('Element', () => {
  beforeEach(() => {
    this.stubbedDriver = new DriverStub();
    this.stubbedElement = {nodeId: 642};
  });

  it('throws when no driver or element is passed', () => {
    assert.throws(() => {
      var _ = new Element();
    });
  });

  it('throws when no driver is passed', () => {
    assert.throws(() => {
      var _ = new Element(this.stubbedElement, undefined);
    });
  });

  it('throws when no element is passed', () => {
    assert.throws(() => {
      var _ = new Element(undefined, this.stubbedDriver);
    });
  });

  it('returns null from getAttribute when no attribute found', () => {
    var element = new Element(this.stubbedElement, this.stubbedDriver);
    return element.getAttribute('notanattribute').then(value => {
      assert.equal(value, null);
    });
  });

  it('returns attribute value from getAttribute', () => {
    var element = new Element(this.stubbedElement, this.stubbedDriver);
    return element.getAttribute('rel').then(value => {
      assert.equal(value, 'manifest');
    });
  });
});
