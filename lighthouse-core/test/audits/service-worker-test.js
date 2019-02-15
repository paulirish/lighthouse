/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const ServiceWorker = require('../../audits/service-worker.js');
const URL = require('../../lib/url-shim.js');
const manifestParser = require('../../lib/manifest-parser.js');
const assert = require('assert');

/* eslint-env jest */

function getBaseDirectory(urlStr) {
  const url = new URL(urlStr);
  return url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
}

/**
 * Create a ServiceWorker artifact from an array of SW config opts.
 * @param {Array<{scriptURL: string, status: string, scopeURL?: string}>} swOpts
 * @return {LH.Artifact['ServiceWorker']}
 */
function createSWArtifact(swOpts) {
  const artifact = {versions: [], registrations: []};
  swOpts.forEach((sw, index) => {
    artifact.versions.push({
      registrationId: `${index}`,
      status: sw.status,
      scriptURL: sw.scriptURL,
    });

    const scopeURL = sw.scopeURL || getBaseDirectory(sw.scriptURL);
    assert.ok(scopeURL.endsWith('/')); // required by SW spec.

    artifact.registrations.push({
      registrationId: `${index}`,
      scopeURL,
    });
  });

  return artifact;
}

/**
 * Create a set of artifacts for the ServiceWorker audit.
 * @param {Array<{scriptURL: string, status: string, scopeURL?: string}>} swOpts
 * @param {string} finalUrl
 * @param {{}}} manifestJson WebAppManifest object or null if no manifest desired.
 */
function createArtifacts(swOpts, finalUrl, manifestJson) {
  const manifestUrl = getBaseDirectory(finalUrl) + 'manifest.json';
  let WebAppManifest;
  if (manifestJson === null) {
    WebAppManifest = null;
  } else if (typeof manifestJson === 'object') {
    WebAppManifest = manifestParser(JSON.stringify(manifestJson), manifestUrl, finalUrl);
  } else {
    throw new Error('unsupported test manifest format');
  }

  return {
    ServiceWorker: createSWArtifact(swOpts),
    URL: {finalUrl},
    WebAppManifest,
  };
}

describe('Offline: service worker audit', () => {
  it('passes when given a controlling service worker', () => {
    const finalUrl = 'https://example.com';
    const swOpts = [{
      status: 'activated',
      scriptURL: 'https://example.com/sw.js',
    }];
    const manifest = {start_url: finalUrl};

    const output = ServiceWorker.audit(createArtifacts(swOpts, finalUrl, manifest));
    assert.deepStrictEqual(output, {rawValue: true});
  });

  it('fails when controlling service worker is not activated', () => {
    const finalUrl = 'https://example.com';
    const swOpts = [{
      status: 'redundant',
      scriptURL: 'https://example.com/sw.js',
    }];
    const manifest = {start_url: finalUrl};

    const output = ServiceWorker.audit(createArtifacts(swOpts, finalUrl, manifest));
    assert.deepStrictEqual(output, {rawValue: false});
  });

  it('discards service worker registrations for other origins', () => {
    const finalUrl = 'https://example.com';
    const swOpts = [{
      status: 'activated',
      scriptURL: 'https://other-example.com',
    }];
    const manifest = {start_url: finalUrl};

    const output = ServiceWorker.audit(createArtifacts(swOpts, finalUrl, manifest));
    assert.deepStrictEqual(output, {rawValue: false});
  });

  it('fails when page URL is out of scope', () => {
    const finalUrl = 'https://example.com/index.html';
    const swOpts = [{
      status: 'activated',
      scriptURL: 'https://example.com/serviceworker/sw.js',
    }];
    const manifest = {start_url: finalUrl};

    const output = ServiceWorker.audit(createArtifacts(swOpts, finalUrl, manifest));
    expect(output).toMatchObject({
      rawValue: false,
      explanation: expect.stringMatching(new RegExp(`${finalUrl}.*not in scope`)),
    });
  });

  it('fails when start_url is out of scope', () => {
    const finalUrl = 'https://example.com/serviceworker/index.html';
    const swOpts = [{
      status: 'activated',
      scriptURL: 'https://example.com/serviceworker/sw.js',
    }];
    const startUrl = 'https://example.com/';
    const manifest = {start_url: startUrl};

    const scopeURL = 'https://example.com/serviceworker';

    const output = ServiceWorker.audit(createArtifacts(swOpts, finalUrl, manifest));
    expect(output).toMatchObject({
      rawValue: false,
      explanation: expect.stringMatching(new RegExp(`start_url.*${startUrl}.*${scopeURL}`)),
    });
  });

  it('fails when explicit scopeURL puts the page URL out of scope', () => {
    const finalUrl = 'https://example.com/index.html';
    const swOpts = [{
      status: 'activated',
      scriptURL: 'https://example.com/sw.js',
      scopeURL: 'https://example.com/serviceworker/',
    }];
    const manifest = {start_url: finalUrl};

    const output = ServiceWorker.audit(createArtifacts(swOpts, finalUrl, manifest));
    expect(output).toMatchObject({
      rawValue: false,
      explanation: expect.stringMatching(new RegExp(`${finalUrl}.*not in scope`)),
    });
  });

  it('fails when explicit scopeURL puts the start_url out of scope', () => {
    const finalUrl = 'https://example.com/serviceworker/index.html';
    const scopeURL = 'https://example.com/serviceworker/';
    const swOpts = [{
      status: 'activated',
      scriptURL: 'https://example.com/sw.js',
      scopeURL,
    }];
    const startUrl = 'https://example.com/';
    const manifest = {start_url: startUrl};

    const output = ServiceWorker.audit(createArtifacts(swOpts, finalUrl, manifest));
    expect(output).toMatchObject({
      rawValue: false,
      explanation: expect.stringMatching(new RegExp(`start_url.*${startUrl}.*${scopeURL}`)),
    });
  });

  it('passes when both outside default scope but explicit scopeURL puts it back in', () => {
    const finalUrl = 'https://example.com/index.html';
    const swOpts = [{
      status: 'activated',
      scriptURL: 'https://example.com/serviceworker/sw.js',
      // can happen when 'Service-Worker-Allowed' header widens max scope.
      scopeURL: 'https://example.com/',
    }];
    const manifest = {start_url: finalUrl};

    const output = ServiceWorker.audit(createArtifacts(swOpts, finalUrl, manifest));
    assert.deepStrictEqual(output, {rawValue: true});
  });

  it('passes when multiple SWs control the scope', () => {
    const finalUrl = 'https://example.com/project/index.html';
    const swOpts = [{
      status: 'activated',
      scriptURL: 'https://example.com/sw.js',
    }, {
      status: 'activated',
      scriptURL: 'https://example.com/project/sw.js',
    }];
    const manifest = {start_url: finalUrl};

    const output = ServiceWorker.audit(createArtifacts(swOpts, finalUrl, manifest));
    assert.deepStrictEqual(output, {rawValue: true});
  });

  it('passes when multiple SWs control the origin but only one is in scope', () => {
    const finalUrl = 'https://example.com/index.html';
    const swOpts = [{
      status: 'activated',
      scriptURL: 'https://example.com/sw.js',
      scopeURL: 'https://example.com/project/',
    }, {
      status: 'activated',
      scriptURL: 'https://example.com/project/sw.js',
      scopeURL: 'https://example.com/project/',
    }, {
      status: 'activated',
      scriptURL: 'https://example.com/project/subproject/sw.js',
      scopeURL: 'https://example.com/',
    }];
    const manifest = {start_url: finalUrl};

    const output = ServiceWorker.audit(createArtifacts(swOpts, finalUrl, manifest));
    assert.deepStrictEqual(output, {rawValue: true});
  });

  it('fails when multiple SWs control the origin but are all out of scope', () => {
    const finalUrl = 'https://example.com/index.html';
    const swOpts = [{
      status: 'activated',
      scriptURL: 'https://example.com/sw.js',
      scopeURL: 'https://example.com/project/',
    }, {
      status: 'activated',
      scriptURL: 'https://example.com/project/sw.js',
      scopeURL: 'https://example.com/project/',
    }, {
      status: 'activated',
      scriptURL: 'https://example.com/project/subproject/sw.js',
      scopeURL: 'https://example.com/project/',
    }];
    const manifest = {start_url: finalUrl};

    const output = ServiceWorker.audit(createArtifacts(swOpts, finalUrl, manifest));
    expect(output).toMatchObject({
      rawValue: false,
      explanation: expect.stringMatching(new RegExp(`${finalUrl}.*not in scope`)),
    });
  });

  it('fails when SW that controls start_url is different than SW that controls page', () => {
    // Tests that most specific SW found for page.
    const finalUrl = 'https://example.com/project/index.html';
    const swOpts = [{
      status: 'activated',
      scriptURL: 'https://example.com/sw.js',
    }, {
      status: 'activated',
      scriptURL: 'https://example.com/project/sw.js',
    }];
    const startUrl = 'https://example.com/index.html';
    const manifest = {start_url: startUrl};

    const scopeURL = 'https://example.com/project';

    const output = ServiceWorker.audit(createArtifacts(swOpts, finalUrl, manifest));
    expect(output).toMatchObject({
      rawValue: false,
      explanation: expect.stringMatching(new RegExp(`start_url.*${startUrl}.*${scopeURL}`)),
    });
  });

  it('fails when a manifest was not found', () => {
    const finalUrl = 'https://example.com';
    const swOpts = [{
      status: 'activated',
      scriptURL: 'https://example.com/sw.js',
    }];
    const manifest = null;

    const output = ServiceWorker.audit(createArtifacts(swOpts, finalUrl, manifest));
    expect(output).toMatchObject({
      rawValue: false,
      explanation: expect.stringMatching(/start_url.*no manifest was fetched/),
    });
  });

  it('fails when a manifest is invalid', () => {
    const finalUrl = 'https://example.com';
    const swOpts = [{
      status: 'activated',
      scriptURL: 'https://example.com/sw.js',
    }];

    const artifacts = createArtifacts(swOpts, finalUrl, {});
    artifacts.WebAppManifest = manifestParser('{,;}', finalUrl, finalUrl);

    const output = ServiceWorker.audit(artifacts);
    expect(output).toMatchObject({
      rawValue: false,
      explanation: expect.stringMatching(/start_url.*manifest failed to parse as valid JSON/),
    });
  });
});
