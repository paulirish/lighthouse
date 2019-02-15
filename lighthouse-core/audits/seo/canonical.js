/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('../audit');
const LinkHeader = require('http-link-header');
const URL = require('../../lib/url-shim');
const MainResource = require('../../computed/main-resource.js');
const LINK_HEADER = 'link';
const i18n = require('../../lib/i18n/i18n.js');

const UIStrings = {
  /** Title of a Lighthouse audit that provides detail on a page's rel=canonical link. This descriptive title is shown to users when the rel=canonical link is valid. "rel=canonical" is an HTML attribute and value and so should not be translated. */
  title: 'Document has a valid `rel=canonical`',
  /** Title of a Lighthouse audit that provides detail on a page's rel=canonical link. This descriptive title is shown to users when the rel=canonical link is invalid and should be fixed. "rel=canonical" is an HTML attribute and value and so should not be translated. */
  failureTitle: 'Document does not have a valid `rel=canonical`',
  /** Description of a Lighthouse audit that tells the user *why* they need to have a valid rel=canonical link. This is displayed after a user expands the section to see more. No character length limits. 'Learn More' becomes link text to additional documentation. */
  description: 'Canonical links suggest which URL to show in search results. ' +
    '[Learn more](https://developers.google.com/web/tools/lighthouse/audits/canonical).',
  /** [ICU Syntax] Explanatory message stating that there was a failure in an audit caused by multiple URLs conflicting with each other. "urlList" will be replaced by a list of URLs (e.g. https://example.com, https://example2.com, etc ). */
  explanationConflict: 'Multiple conflicting URLs ({urlList})',
  /** [ICU Syntax] Explanatory message stating that there was a failure in an audit caused by a URL being invalid. "url" will be replaced by the invalid URL (e.g. https://example.com). */
  explanationInvalid: 'Invalid URL ({url})',
  /** [ICU Syntax] Explanatory message stating that there was a failure in an audit caused by a URL being relative instead of absolute. "url" will be replaced by the invalid URL (e.g. https://example.com). */
  explanationRelative: 'Relative URL ({url})',
  /** [ICU Syntax] Explanatory message stating that there was a failure in an audit caused by a URL pointing to a different hreflang than the current context. "url" will be replaced by the invalid URL (e.g. https://example.com). 'hreflang' is an HTML attribute and should not be translated. */
  explanationPointsElsewhere: 'Points to another `hreflang` location ({url})',
  /** [ICU Syntax] Explanatory message stating that there was a failure in an audit caused by a URL pointing to a different domain. "url" will be replaced by the invalid URL (e.g. https://example.com). */
  explanationDifferentDomain: 'Points to a different domain ({url})',
  /** Explanatory message stating that the page's canonical URL was pointing to the domain's root URL, which is a common mistake. "points" refers to the action of the 'rel=canonical' referencing another link. "root" refers to the starting/home page of the website. "domain" refers to the registered domain name of the website. */
  explanationRoot: 'Points to the domain\'s root URL (the homepage), ' +
    'instead of an equivalent page of content',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/**
 * @param {string} headerValue
 * @returns {Array<string>}
 */
function getCanonicalLinksFromHeader(headerValue) {
  const linkHeader = LinkHeader.parse(headerValue);

  return linkHeader.get('rel', 'canonical').map(c => c.uri);
}

/**
 * @param {string} headerValue
 * @returns {Array<string>}
 */
function getHreflangsFromHeader(headerValue) {
  const linkHeader = LinkHeader.parse(headerValue);

  return linkHeader.get('rel', 'alternate').map(h => h.uri);
}

/**
 * Returns true if given string is a valid absolute or relative URL
 * @param {string} url
 * @returns {boolean}
 */
function isValidRelativeOrAbsoluteURL(url) {
  try {
    new URL(url, 'https://example.com/');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Returns a primary domain for provided URL (e.g. http://www.example.com -> example.com).
 * Note that it does not take second-level domains into account (.co.uk).
 * @param {URL} url
 * @returns {string}
 */
function getPrimaryDomain(url) {
  return url.hostname.split('.').slice(-2).join('.');
}

class Canonical extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'canonical',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['Canonical', 'Hreflang', 'URL'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static audit(artifacts, context) {
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];

    return MainResource.request({devtoolsLog, URL: artifacts.URL}, context)
      .then(mainResource => {
        const baseURL = new URL(mainResource.url);
        /** @type {Array<string>} */
        let canonicals = [];
        /** @type {Array<string>} */
        let hreflangs = [];

        mainResource.responseHeaders && mainResource.responseHeaders
          .filter(h => h.name.toLowerCase() === LINK_HEADER)
          .forEach(h => {
            canonicals = canonicals.concat(getCanonicalLinksFromHeader(h.value));
            hreflangs = hreflangs.concat(getHreflangsFromHeader(h.value));
          });

        for (const canonical of artifacts.Canonical) {
          if (canonical !== null) {
            canonicals.push(canonical);
          }
        }
        // we should only fail if there are multiple conflicting URLs
        // see: https://github.com/GoogleChrome/lighthouse/issues/3178#issuecomment-381181762
        canonicals = Array.from(new Set(canonicals));

        artifacts.Hreflang.forEach(({href}) => hreflangs.push(href));

        hreflangs = hreflangs
          .filter(href => isValidRelativeOrAbsoluteURL(href))
          .map(href => (new URL(href, baseURL)).href); // normalize URLs

        if (canonicals.length === 0) {
          return {
            rawValue: true,
            notApplicable: true,
          };
        }

        if (canonicals.length > 1) {
          return {
            rawValue: false,
            explanation: str_(UIStrings.explanationConflict, {urlList: canonicals.join(', ')}),
          };
        }

        const canonical = canonicals[0];

        if (!isValidRelativeOrAbsoluteURL(canonical)) {
          return {
            rawValue: false,
            explanation: str_(UIStrings.explanationInvalid, {url: canonical}),
          };
        }

        if (!URL.isValid(canonical)) {
          return {
            rawValue: false,
            explanation: str_(UIStrings.explanationRelative, {url: canonical}),
          };
        }

        const canonicalURL = new URL(canonical);

        // cross-language or cross-country canonicals are a common issue
        if (hreflangs.includes(baseURL.href) && hreflangs.includes(canonicalURL.href) &&
          baseURL.href !== canonicalURL.href) {
          return {
            rawValue: false,
            explanation: str_(UIStrings.explanationPointsElsewhere, {url: baseURL.href}),
          };
        }

        // bing and yahoo don't allow canonical URLs pointing to different domains, it's also
        // a common mistake to publish a page with canonical pointing to e.g. a test domain or localhost
        if (getPrimaryDomain(canonicalURL) !== getPrimaryDomain(baseURL)) {
          return {
            rawValue: false,
            explanation: str_(UIStrings.explanationDifferentDomain, {url: canonicalURL}),
          };
        }

        // another common mistake is to have canonical pointing from all pages of the website to its root
        if (canonicalURL.origin === baseURL.origin &&
          canonicalURL.pathname === '/' && baseURL.pathname !== '/') {
          return {
            rawValue: false,
            explanation: str_(UIStrings.explanationRoot),
          };
        }

        return {
          rawValue: true,
        };
      });
  }
}

module.exports = Canonical;
module.exports.UIStrings = UIStrings;
