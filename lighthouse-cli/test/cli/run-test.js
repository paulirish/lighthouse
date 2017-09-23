/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env mocha */
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const run = require('../../run');
const parseChromeFlags = require('../../run').parseChromeFlags;
const fastConfig = {
  'extends': 'lighthouse:default',
  'settings': {
    'onlyAudits': ['viewport'],
  },
};

const getFlags = require('../../cli-flags').getFlags;

describe('CLI run', function() {
  it('runLighthouse completes a LH round trip', () => {
    const url = 'chrome://version';
    const filename = path.join(process.cwd(), 'run.ts.results.json');
    const flags = getFlags(`--output=json --output-path=${filename} ${url}`);
    return run.runLighthouse(url, flags, fastConfig).then(passedResults => {
      assert.ok(fs.existsSync(filename));
      const results = JSON.parse(fs.readFileSync(filename, 'utf-8'));
      assert.equal(results.audits.viewport.rawValue, false);

      // passed results match saved results
      assert.strictEqual(results.generatedTime, passedResults.generatedTime);
      assert.strictEqual(results.url, passedResults.url);
      assert.strictEqual(results.audits.viewport.rawValue, passedResults.audits.viewport.rawValue);
      assert.strictEqual(
          Object.keys(results.audits).length,
          Object.keys(passedResults.audits).length);
      assert.deepStrictEqual(results.timing, passedResults.timing);

      fs.unlinkSync(filename);
    });
  }).timeout(60000);
});

describe('Parsing --chrome-flags', () => {
  it('returns boolean flags that are true as a bare flag', () => {
    assert.deepStrictEqual(['--debug'], parseChromeFlags('--debug'));
  });

  it('returns boolean flags that are false with value', () => {
    assert.deepStrictEqual(['--debug=false'], parseChromeFlags('--debug=false'));
  });

  it('returns boolean flags that empty when passed undefined', () => {
    assert.deepStrictEqual([], parseChromeFlags());
  });

  it('returns flags correctly for issue 2817', () => {
    assert.deepStrictEqual(
        ['--host-resolver-rules="MAP www.example.org:443 127.0.0.1:8443"'],
        parseChromeFlags('--host-resolver-rules="MAP www.example.org:443 127.0.0.1:8443"')
    );
  });

  it('returns all flags as provided', () => {
    assert.deepStrictEqual(
        ['--spaces="1 2 3 4"', '--debug=false', '--verbose', '--more-spaces="9 9 9"'],
        parseChromeFlags('--spaces="1 2 3 4" --debug=false --verbose --more-spaces="9 9 9"')
    );
  });
});
