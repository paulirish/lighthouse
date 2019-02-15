/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const HreflangAudit = require('../../../audits/seo/hreflang.js');
const assert = require('assert');
const networkRecordsToDevtoolsLog = require('../../network-records-to-devtools-log.js');

/* eslint-env jest */

describe('SEO: Document has valid hreflang code', () => {
  it('fails when language code provided in hreflang via link element is invalid', () => {
    const hreflangValues = [
      'xx',
      'XX-be',
      'XX-be-Hans',
      '',
      '  es',
    ];

    const allRuns = hreflangValues.map(hreflangValue => {
      const finalUrl = 'https://example.com';
      const mainResource = {
        url: finalUrl,
        responseHeaders: [],
      };
      const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
      const artifacts = {
        devtoolsLogs: {[HreflangAudit.DEFAULT_PASS]: devtoolsLog},
        URL: {finalUrl},
        Hreflang: [{
          hreflang: hreflangValue,
          href: 'https://example.com',
        }],
      };

      const context = {computedCache: new Map()};
      return HreflangAudit.audit(artifacts, context).then(auditResult => {
        assert.equal(auditResult.rawValue, false);
        assert.equal(auditResult.details.items.length, 1);
      });
    });

    return Promise.all(allRuns);
  });

  it('succeeds when language code provided via link element is valid', () => {
    const finalUrl = 'https://example.com';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[HreflangAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      Hreflang: [
        {hreflang: 'pl'},
        {hreflang: 'nl-be'},
        {hreflang: 'zh-Hans'},
        {hreflang: 'x-default'},
        {hreflang: 'FR-BE'},
      ],
    };

    const context = {computedCache: new Map()};
    return HreflangAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.rawValue, true);
    });
  });

  it('succeeds when there are no rel=alternate link elements nor headers', () => {
    const finalUrl = 'https://example.com';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[HreflangAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      Hreflang: [],
    };

    const context = {computedCache: new Map()};
    return HreflangAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.rawValue, true);
    });
  });

  it('fails when language code provided in hreflang via header is invalid', () => {
    const linkHeaders = [
      [
        {name: 'Link', value: '<http://es.example.com/>; rel="alternate"; hreflang="xx"'},
      ],
      [
        {name: 'link', value: '<http://es.example.com/>; rel="alternate"; hreflang=""'},
      ],
      [
        {name: 'LINK', value: '<http://es.example.com/>; rel="alternate"'},
      ],
      [
        {name: 'Link', value: '<http://es.example.com/>; rel="alternate"; hreflang="es",<http://xx.example.com/>; rel="alternate"; Hreflang="xx"'},
      ],
      [
        {name: 'link', value: '<http://es.example.com/>; rel="alternate"; hreflang="es"'},
        {name: 'Link', value: '<http://xx.example.com/>; rel="alternate"; hreflang="x"'},
      ],
    ];

    const allRuns = linkHeaders.map(headers => {
      const finalUrl = 'https://example.com';
      const mainResource = {
        url: finalUrl,
        responseHeaders: headers,
      };
      const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
      const artifacts = {
        devtoolsLogs: {[HreflangAudit.DEFAULT_PASS]: devtoolsLog},
        URL: {finalUrl},
        Hreflang: null,
      };

      const context = {computedCache: new Map()};
      return HreflangAudit.audit(artifacts, context).then(auditResult => {
        assert.equal(auditResult.rawValue, false);
        assert.equal(auditResult.details.items.length, 1);
      });
    });

    return Promise.all(allRuns);
  });

  it('succeeds when language codes provided via Link header are valid', () => {
    const finalUrl = 'https://example.com';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [
        {name: 'link', value: ''},
        {name: 'link', value: 'garbage'},
        {name: 'link', value: '<http://es.example.com/>; rel="example"; hreflang="xx"'},
        {name: 'link', value: '<http://es.example.com/>; rel="alternate"; hreflang="es"'},
        {name: 'Link', value: '<http://fr.example.com/>; rel="alternate"; hreflang="fr-be"'},
        {name: 'LINK', value: '<http://es.example.com/>; rel="alternate"; hreflang="es",<http://fr.example.com/>; rel="alternate"; Hreflang="fr-be"'},
      ],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[HreflangAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      Hreflang: null,
    };

    const context = {computedCache: new Map()};
    return HreflangAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.rawValue, true);
    });
  });

  it('returns all failing items', () => {
    const finalUrl = 'https://example.com';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [
        {name: 'link', value: '<http://xx1.example.com/>; rel="alternate"; hreflang="xx1"'},
        {name: 'Link', value: '<http://xx2.example.com/>; rel="alternate"; hreflang="xx2"'},
      ],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[HreflangAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      Hreflang: [{
        hreflang: 'xx3',
      }, {
        hreflang: 'xx4',
      }],
    };

    const context = {computedCache: new Map()};
    return HreflangAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.rawValue, false);
      assert.equal(auditResult.details.items.length, 4);
    });
  });
});
