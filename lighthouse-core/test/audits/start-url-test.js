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
const Audit = require('../../audits/manifest-start-url.js');
const assert = require('assert');
const manifestSrc = JSON.stringify(require('../fixtures/manifest.json'));
const manifestParser = require('../../lib/manifest-parser');
const exampleManifest = manifestParser(manifestSrc);

/* global describe, it*/

describe('Manifest: start_url audit', () => {
  it('fails when no manifest artifact present', () => {
    return assert.equal(Audit.audit({Manifest: {
      value: undefined
    }}).rawValue, false);
  });

  it('fails when an empty manifest is present', () => {
    const artifacts = {
      Manifest: manifestParser('{}')
    };
    const output = Audit.audit(artifacts);
    assert.equal(output.rawValue, false);
    assert.equal(output.debugString, undefined);
  });

  // Need to disable camelcase check for dealing with start_url.
  /* eslint-disable camelcase */
  it('fails when a manifest contains no start_url', () => {
    const artifacts = {
      Manifest: manifestParser(JSON.stringify({
        start_url: undefined
      }))
    };
    const output = Audit.audit(artifacts);
    assert.equal(output.rawValue, false);
    assert.equal(output.debugString, undefined);
  });

  it('succeeds when a minimal manifest contains a start_url', () => {
    const artifacts = {
      Manifest: manifestParser(JSON.stringify({
        start_url: '/'
      }))
    };
    const output = Audit.audit(artifacts);
    assert.equal(output.rawValue, true);
    assert.equal(output.debugString, undefined);
  });
  /* eslint-enable camelcase */

  it('succeeds when a complete manifest contains a start_url', () => {
    return assert.equal(Audit.audit({Manifest: exampleManifest}).rawValue, true);
  });
});
