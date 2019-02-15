/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const CanonicalAudit = require('../../../audits/seo/canonical.js');
const assert = require('assert');
const networkRecordsToDevtoolsLog = require('../../network-records-to-devtools-log.js');

/* eslint-env jest */

describe('SEO: Document has valid canonical link', () => {
  it('succeeds when there are no canonical links', () => {
    const finalUrl = 'https://example.com/';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CanonicalAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      Canonical: [],
      Hreflang: [],
    };

    const context = {computedCache: new Map()};
    return CanonicalAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.rawValue, true);
    });
  });

  it('fails when there are multiple canonical links', () => {
    const finalUrl = 'http://www.example.com/';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [{
        name: 'Link',
        value: '<https://example.com>; rel="canonical"',
      }],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CanonicalAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      Canonical: ['https://www.example.com'],
      Hreflang: [],
    };

    const context = {computedCache: new Map()};
    return CanonicalAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.rawValue, false);
      expect(auditResult.explanation)
        .toBeDisplayString('Multiple conflicting URLs (https://example.com, https://www.example.com)');
    });
  });

  it('fails when canonical url is invalid', () => {
    const finalUrl = 'http://www.example.com';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CanonicalAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      Canonical: ['https:// example.com'],
      Hreflang: [],
    };

    const context = {computedCache: new Map()};
    return CanonicalAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.rawValue, false);
      assert.ok(auditResult.explanation.includes('Invalid'), auditResult.explanation);
    });
  });

  it('fails when canonical url is relative', () => {
    const finalUrl = 'https://example.com/de/';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CanonicalAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      Canonical: ['/'],
      Hreflang: [],
    };

    const context = {computedCache: new Map()};
    return CanonicalAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.rawValue, false);
      assert.ok(auditResult.explanation.includes('Relative'), auditResult.explanation);
    });
  });

  it('fails when canonical points to a different hreflang', () => {
    const finalUrl = 'https://example.com';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [{
        name: 'Link',
        value: '<https://example.com/>; rel="alternate"; hreflang="xx"',
      }],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CanonicalAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      Canonical: ['https://example.com/fr/'],
      Hreflang: [{href: 'https://example.com/fr/'}],
    };

    const context = {computedCache: new Map()};
    return CanonicalAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.rawValue, false);
      expect(auditResult.explanation)
        .toBeDisplayString('Points to another `hreflang` location (https://example.com/)');
    });
  });

  it('fails when canonical points to a different domain', () => {
    const finalUrl = 'http://localhost.test';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CanonicalAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      Canonical: ['https://example.com/'],
      Hreflang: [],
    };

    const context = {computedCache: new Map()};
    return CanonicalAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.rawValue, false);
      expect(auditResult.explanation)
        .toBeDisplayString('Points to a different domain (https://example.com/)');
    });
  });

  it('passes when canonical points to the root while current URL is also the root', async () => {
    const finalUrl = 'https://example.com/';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CanonicalAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      Canonical: ['https://example.com/'],
      Hreflang: [],
    };

    const context = {computedCache: new Map()};
    const auditResult = await CanonicalAudit.audit(artifacts, context);
    assert.equal(auditResult.rawValue, true);
  });

  it('fails when canonical points to the root while current URL is not the root', () => {
    const finalUrl = 'https://example.com/articles/cats-and-you';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CanonicalAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      Canonical: ['https://example.com/'],
      Hreflang: [],
    };

    const context = {computedCache: new Map()};
    return CanonicalAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.rawValue, false);
      expect(auditResult.explanation).toBeDisplayString('Points to the domain\'s root URL (the ' +
        'homepage), instead of an equivalent page of content');
    });
  });

  it('succeeds when there are multiple identical canonical links', () => {
    const finalUrl = 'http://www.example.com/';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [{
        name: 'Link',
        value: '<https://www.example.com>; rel="canonical"',
      }],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CanonicalAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      Canonical: ['https://www.example.com'],
      Hreflang: [],
    };

    const context = {computedCache: new Map()};
    return CanonicalAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.rawValue, true);
    });
  });

  it('succeeds when valid canonical is provided via meta tag', () => {
    const finalUrl = 'http://example.com/articles/cats-and-you?utm_source=twitter';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CanonicalAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      Canonical: ['https://example.com/articles/cats-and-you'],
      Hreflang: [],
    };

    const context = {computedCache: new Map()};
    return CanonicalAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.rawValue, true);
    });
  });

  it('succeeds when valid canonical is provided via header', () => {
    const finalUrl = 'http://example.com/articles/cats-and-you?utm_source=twitter';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [{
        name: 'Link',
        value: '<http://example.com/articles/cats-and-you>; rel="canonical"',
      }],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CanonicalAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      Canonical: [],
      Hreflang: [],
    };

    const context = {computedCache: new Map()};
    return CanonicalAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.rawValue, true);
    });
  });
});
