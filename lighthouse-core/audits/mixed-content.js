/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * This audit is supposed to compare the default pass with the mixed content
 * pass and see which urls that aren't already over HTTPS are able to be
 * switched over and which ones are still HTTP only. We do this with the
 * network request Interceptor. However, in it's current state, it only prints
 * out the resources that ARE available over HTTPS.
 * TODO: compare resources from mixed content pass to default pass and identify
 * which ones are HTTP that can be updated to HTTP and which ones cant.
 */

const Audit = require('./audit');
const URL = require('../lib/url-shim');
const Util = require('../report/v2/renderer/util');
const https = require('https');


const SECURE_SCHEMES = ['data', 'https', 'wss', 'blob', 'chrome', 'chrome-extension'];
const SECURE_DOMAINS = ['localhost', '127.0.0.1'];

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
          'resources could be upgraded to HTTPS. ' +
          '[Learn more](https://example.org)',
      requiredArtifacts: ['MixedContent', 'devtoolsLogs']
    };
  }

  /**
   * @param {{scheme: string, protocol: string, domain: string}} record
   * @return {boolean}
   */
  static isSecureRecord(record) {
    return SECURE_SCHEMES.includes(record.scheme) ||
           SECURE_SCHEMES.includes(record.protocol) ||
           SECURE_DOMAINS.includes(record.domain);
  }

  /**
   * Upgrades a URL to use HTTPS.
   *
   * @param {string} url
   * @return {string}
   */
  static upgradeURL(url) {
    let parsedURL = new URL(url);
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
    let parsedURL = new URL(url);
    parsedURL.hash = '';
    parsedURL.search = '';
    return parsedURL.href;
    // return url.replace('?' + parsedURL.queryParams, '');
  }
  // TODO: Would matching on hostname/file be a better solution?
  // Might have different paths after redirects but be "available"? But this
  // doesn't tell the dev exactly _how_ to upgrade the URLs used (to be fair,
  // the current audit output doesn't either).

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const defaultLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const upgradeLogs = artifacts.devtoolsLogs['mixedContentPass'];

    const computedArtifacts = [
      artifacts.requestNetworkRecords(defaultLogs),
      artifacts.requestNetworkRecords(upgradeLogs),
    ];

    return Promise.all(computedArtifacts)
        .then(([defaultRecords, upgradedRecords]) => {

      // Filter the default pass records into "insecure" and "secure".
      var insecureRecords = defaultRecords
        .filter(record => !MixedContent.isSecureRecord(record));
      var secureRecords = defaultRecords
        .filter(record => MixedContent.isSecureRecord(record));

      // Extract the successful HTTPS upgrades and failed HTTPS upgrades.
      // TODO: These are the _requests_ (which had been transparently upgraded by
      // the interceptor!) rather than the results?
      const successfulRecords = upgradedRecords.filter(record => record.finished);
      const failedRecords = upgradedRecords.filter(record => !record.finished);

      console.log(artifacts.MixedContent.successfulRecords);
      console.log(artifacts.MixedContent.failedRecords);

      // TODO: Just make a set of hosts we successfully upgraded on.
      // TODO: Per-host is becoming less of a set, more of a hashtable.
      var successfulSecureHostsSet = new Set();
      successfulRecords.filter(record => MixedContent.isSecureRecord(record))
        .forEach(secureRecord => {
          successfulSecureHostsSet.add(new URL(secureRecord.url).hostname);
        });
      console.log('*UPGRADEABLE HOSTS:');
      console.log(successfulSecureHostsSet);

      var successfulSecureRecordsSet = new Set();
      successfulRecords.filter(record => MixedContent.isSecureRecord(record))
        .forEach(secureRecord => {
          successfulSecureRecordsSet.add(this.simplifyURL(secureRecord.url));
        });

      // "Upgradeable" is the intersection of insecure successfulSecure.
      let numUpgradeable = 0;
      let resources = [];
      let upgradeableResources = [];
      var seen = new Set();
      const insecureUrls = insecureRecords.filter(record => {
        var url = this.simplifyURL(record.url);
        return seen.has(url) ? false : seen.add(url);
      });
      // .map(record => this.simplifyURL(record.url));

      const displayOptions = {
        numPathParts: 4,
        preserveQuery: false,
        preserveHost: true
      }
      // TODO: Group requests by hostname and report # insecure requests to each host
      // and whether that host is upgradeable.
      insecureUrls.forEach(record => {
        var resource = {
          host: new URL(record.url).hostname,
          url: URL.getURLDisplayName(record.url, displayOptions),
          full: record.url,
          initiator: URL.getURLDisplayName(record._documentURL, displayOptions),
          type: record._initiator.type,
          // initiator: record._initiator.url ?
          //   URL.getURLDisplayName(record._initiator.url, displayOptions) : record._initiator.type,
          canUpgrade: 'No'
        };
        const upgradedUrl = this.simplifyURL(this.upgradeURL(record.url)); //.replace(/^http:\/\//, 'https://'));
        console.log(`UPGRADED URL: ${upgradedUrl}`);
        if (successfulSecureHostsSet.has(resource.host)) {
        // if (successfulSecureRecordsSet.has(upgradedUrl)) {
          resource.canUpgrade = 'Yes';
          resource.replacement = upgradedUrl;
          numUpgradeable += 1;
          upgradeableResources.push(resource);
        } else {
          resources.push(resource);
        }
      });

      // Concat resources to place upgradeable resources first in the list.
      resources = upgradeableResources.concat(resources);

      // "Blockers" are everything remaining.
      // We can then report the lists of both (with guidance):
      // - You can upgrade x -> y
      // - Z does not appear to provide a version of x over HTTPS.
      //   You should contact Z or switch to a different provider.

      let displayValue = '';
      if (insecureRecords.length > 1) {
        displayValue = `${Util.formatNumber(insecureRecords.length)} insecure requests found,\n`;
      } else if (insecureRecords.length === 1) {
        displayValue = `${insecureRecords.length} insecure request found`;
      }
      if (numUpgradeable != 1) {
        displayValue += `${Util.formatNumber(numUpgradeable)} upgradeable requests found`;
      } else if (numUpgradeable === 1) {
        displayValue += `${Util.formatNumber(numUpgradeable)} upgradeable request found`;
      }

      const headings = [
        {key: 'host', itemType: 'text', text: 'Hostname'},
        {key: 'full', itemType: 'url', text: 'Full URL'},
        {key: 'initiator', itemType: 'text', text: 'Initiator'},
        {key: 'type', itemType: 'text', text: 'Type'},
        {key: 'canUpgrade', itemType: 'text', text: 'Upgradeable?'}
      ];
      const details = Audit.makeTableDetails(headings, resources);

      // Our "score" for mixed content is:
      // - (# secure resources + 0.5 * # upgradeable resource) / # total resources * 100
      const totalRecords = insecureRecords.length + secureRecords.length;
      const score = 100 * (secureRecords.length + 0.5 * numUpgradeable) / totalRecords;
      return {
        rawValue: score,
        displayValue: displayValue,
        details,
      };
    });
  }
}

module.exports = MixedContent;
