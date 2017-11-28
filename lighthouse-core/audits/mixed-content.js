/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('./audit');
const URL = require('../lib/url-shim');
const Util = require('../report/v2/renderer/util');

/**
 * This audit checks which resources a page currently loads over HTTP which it
 * could instead load over HTTPS, and which resources are still HTTP only.
 * This audit uses two passes: one to see the current state of requests, and 
 * one to attempt upgrading each request to HTTPS.
 */
class MixedContent extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      category: 'Mixed Content',
      name: 'mixed-content',
      description: 'All resources loaded are secure',
      informative: true,
      failureDescription: 'Some resources loaded are insecure',
      helpText: 'Resources loaded should use secure protocols (e.g., https). ' +
          'Insecure resources can cause mixed content warnings and fail to ' +
          'load if your site uses HTTPS. This shows whether any insecure ' +
          'resources could be upgraded to HTTPS. If a third-party resource ' +
          'is not upgradeable, you may want to contact the site owner.',
      requiredArtifacts: ['devtoolsLogs'],
    };
  }

  /**
   * Checks whether the resource was securely loaded.
   * We special-case data: URLs, as they inherit the security state of their
   * initiator, and so are trivially "upgradeable" for mixed-content purposes.
   * 
   * @param {{scheme: string, protocol: string, securityState: function}} record
   * @return {boolean}
   */
  static isSecureRecord(record) {
    return record.securityState() === 'secure' ||
           record.scheme === 'data' ||
           record.protocol === 'data';
  }

  /**
   * Upgrades a URL to use HTTPS.
   *
   * @param {string} url
   * @return {string}
   */
  static upgradeURL(url) {
    const parsedURL = new URL(url);
    parsedURL.protocol = 'https:';
    return parsedURL.href;
  }

  /**
   * Simplifies a URL string by removing the query string and fragments.
   *
   * @param {string} url
   * @return {string}
   */
  static simplifyURL(url) {
    const parsedURL = new URL(url);
    parsedURL.hash = '';
    parsedURL.search = '';
    return parsedURL.href;
  }

  /**
   * Simplifies a URL string for display.
   * 
   * @param {string} url 
   * @return {string}
   */
  static displayURL(url) {
    const displayOptions = {
      numPathParts: 4,
      preserveQuery: false,
      preserveHost: true,
    };
    return URL.getURLDisplayName(url, displayOptions);
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const defaultLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const mixedContentLogs = artifacts.devtoolsLogs['mixedContentPass'];

    const computedArtifacts = [
      artifacts.requestNetworkRecords(defaultLogs),
      artifacts.requestNetworkRecords(mixedContentLogs),
    ];

    return Promise.all(computedArtifacts).then(([defaultRecords, mixedContentRecords]) => {
      const insecureRecords = defaultRecords.filter(
          record => !MixedContent.isSecureRecord(record));
      const secureRecords = defaultRecords.filter(
          record => MixedContent.isSecureRecord(record));

      const successfulRecords = mixedContentRecords
          .filter(record => record.finished);
      const failedRecords = mixedContentRecords
          .filter(record => !record.finished);

      const newHosts = new Set();
      successfulRecords.forEach(record =>
          newHosts.add(new URL(record.url).hostname));
      failedRecords.forEach(record =>
          newHosts.add(new URL(record.url).hostname));

      const secureHosts = new Set();
      successfulRecords.filter(record => MixedContent.isSecureRecord(record))
          .forEach(secureRecord => {
            secureHosts.add(new URL(secureRecord.url).hostname);
          });

      // De-duplicate records based on URL without fragment or query.
      const seen = new Set();
      const insecureUrls = insecureRecords.filter(record => {
        const url = this.simplifyURL(record.url);
        return seen.has(url) ? false : seen.add(url);
      });

      const upgradeableResources = [];
      const nonUpgradeableResources = [];
      insecureUrls.forEach(record => {
        const resource = {
          host: new URL(record.url).hostname,
          url: this.displayURL(record.url),
          full: record.url,
          initiator: this.displayURL(record._documentURL),
          canUpgrade: 'No',
        };
        if (secureHosts.has(resource.host)) {
          resource.canUpgrade = 'Yes';
          upgradeableResources.push(resource);
        } else if (newHosts.has(resource.host)) {
          // We saw this host in the second pass (otherwise, we never had
          // a chance to test whether we could upgrade it at all).
          nonUpgradeableResources.push(resource);
        }
      });

      // Place upgradeable resources first in the list.
      const resources = upgradeableResources.concat(nonUpgradeableResources);

      const displayValue = `${Util.formatNumber(insecureUrls.length)} insecure 
          ${insecureRecords.length === 1 ? 'request' : 'requests'} found,
          ${Util.formatNumber(upgradeableResources.length)} upgradeable 
          ${upgradeableResources.length === 1 ? 'request' : 'requests'} found`;

      const headings = [
        {key: 'host', itemType: 'text', text: 'Hostname'},
        {key: 'full', itemType: 'url', text: 'Full URL'},
        {key: 'initiator', itemType: 'text', text: 'Initiator'},
        {key: 'canUpgrade', itemType: 'text', text: 'Upgradeable?'},
      ];
      const details = Audit.makeTableDetails(headings, resources);

      const totalRecords = defaultRecords.length;
      const score = 100 *
          (secureRecords.length + 0.5 * upgradeableResources.length)
          / totalRecords;

      return {
        rawValue: score,
        displayValue: displayValue,
        details,
      };
    });
  }
}

module.exports = MixedContent;
