/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const StartUrlGatherer = require('../../../gather/gatherers/start-url.js');
const parseManifest = require('../../../lib/manifest-parser.js');
const assert = require('assert');

const mockDriver = {
  goOffline() {
    return Promise.resolve();
  },
  goOnline() {
    return Promise.resolve();
  },
  off() {},
};

const wrapSendCommand = (mockDriver, url, status = 200, fromServiceWorker = false) => {
  mockDriver = Object.assign({}, mockDriver);
  mockDriver.evaluateAsync = () => Promise.resolve();
  mockDriver.on = (name, cb) => {
    cb({response: {status, url, fromServiceWorker}});
  };

  return mockDriver;
};

describe('Start-url gatherer', () => {
  let baseArtifacts;

  function createArtifactsWithURL(url) {
    return {WebAppManifest: {value: {start_url: {value: url}}}};
  }

  beforeEach(() => {
    jest.useFakeTimers();
    baseArtifacts = {WebAppManifest: null};
  });

  afterEach(() => {
    jest.advanceTimersByTime(5000);
  });

  it('returns an artifact set to -1 when offline loading fails', () => {
    const startUrlGatherer = new StartUrlGatherer();
    const startUrlGathererWithQueryString = new StartUrlGatherer();
    const startUrlGathererWithResponseNotFromSW = new StartUrlGatherer();
    const throwOnEvaluate = (mockDriver) => {
      mockDriver.on = () => {};
      mockDriver.evaluateAsync = () => {
        throw new Error({
          TypeError: 'Failed to fetch',
          __failedInBrowser: true,
          name: 'TypeError',
          message: 'Failed to fetch',
        });
      };

      return mockDriver;
    };

    const passContext = {
      url: 'https://do-not-match.com/',
      baseArtifacts,
      driver: throwOnEvaluate(wrapSendCommand(mockDriver, 'https://do-not-match.com/', -1)),
    };
    const passContextWithFragment = {
      baseArtifacts,
      url: 'https://ifixit-pwa.appspot.com/?history',
      driver: throwOnEvaluate(wrapSendCommand(mockDriver, 'https://ifixit-pwa.appspot.com/?history', -1)),
    };
    const passContextWithResponseNotFromSW = {
      url: 'https://do-not-match.com/',
      baseArtifacts: createArtifactsWithURL('https://do-not-match.com/'),
      driver: wrapSendCommand(mockDriver, 'https://do-not-match.com/', 200),
    };

    return Promise.all([
      startUrlGatherer.afterPass(passContext),
      startUrlGathererWithQueryString.afterPass(passContextWithFragment),
      startUrlGathererWithResponseNotFromSW.afterPass(passContextWithResponseNotFromSW),
    ]).then(([artifact, artifactWithQueryString, artifactWithResponseNotFromSW]) => {
      assert.equal(artifact.statusCode, -1);
      assert.ok(artifact.explanation, 'did not set debug string');
      assert.equal(artifactWithQueryString.statusCode, -1);
      assert.ok(artifactWithQueryString.explanation, 'did not set debug string');
      assert.equal(artifactWithResponseNotFromSW.statusCode, -1);
      assert.equal(artifactWithResponseNotFromSW.explanation,
          'Unable to fetch start URL via service worker.');
    });
  });

  it('returns an artifact set to 200 when offline loading from service worker succeeds', () => {
    const startUrlGatherer = new StartUrlGatherer();
    const startUrlGathererWithFragment = new StartUrlGatherer();
    const passContext = {
      url: 'https://ifixit-pwa.appspot.com/',
      baseArtifacts: createArtifactsWithURL('https://ifixit-pwa.appspot.com/'),
      driver: wrapSendCommand(mockDriver, 'https://ifixit-pwa.appspot.com/', 200, true),
    };
    const passContextWithFragment = {
      url: 'https://ifixit-pwa.appspot.com/#/history',
      baseArtifacts: createArtifactsWithURL('https://ifixit-pwa.appspot.com/#/history'),
      driver: wrapSendCommand(mockDriver, 'https://ifixit-pwa.appspot.com/#/history', 200, true),
    };

    return Promise.all([
      startUrlGatherer.afterPass(passContext),
      startUrlGathererWithFragment.afterPass(passContextWithFragment),
    ]).then(([artifact, artifactWithFragment]) => {
      assert.equal(artifact.statusCode, 200);
      assert.equal(artifactWithFragment.statusCode, 200);
    });
  });

  it('returns a explanation when manifest cannot be found', () => {
    const driver = Object.assign({}, mockDriver);
    const startUrlGatherer = new StartUrlGatherer();
    const passContext = {
      baseArtifacts,
      url: 'https://ifixit-pwa.appspot.com/',
      driver,
    };

    return startUrlGatherer.afterPass(passContext)
      .then(artifact => {
        assert.equal(artifact.explanation,
          `No usable web app manifest found on page.`);
      });
  });

  it('returns a explanation when manifest cannot be parsed', () => {
    const driver = Object.assign({}, mockDriver);
    const startUrlGatherer = new StartUrlGatherer();
    const passContext = {
      baseArtifacts,
      url: 'https://ifixit-pwa.appspot.com/',
      driver,
    };

    baseArtifacts.WebAppManifest = parseManifest(
      'this is invalid',
      'https://ifixit-pwa.appspot.com/manifest.json',
      passContext.url
    );

    return startUrlGatherer.afterPass(passContext)
      .then(artifact => {
        assert.equal(artifact.explanation,
          `Error fetching web app manifest: ERROR: file isn't valid JSON: ` +
          `SyntaxError: Unexpected token h in JSON at position 1.`);
      });
  });

  it('times out when a start_url is too slow to respond', async () => {
    const startUrlGatherer = new StartUrlGatherer();
    const passContext = {
      url: 'https://ifixit-pwa.appspot.com/',
      baseArtifacts: createArtifactsWithURL('https://ifixit-pwa.appspot.com/'),
      driver: wrapSendCommand(mockDriver, ''),
    };

    const resultPromise = startUrlGatherer.afterPass(passContext);
    jest.advanceTimersByTime(5000);
    const artifact = await resultPromise;
    assert.equal(artifact.explanation, 'Timed out waiting for fetched start_url.');
  });
});
