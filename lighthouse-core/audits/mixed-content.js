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
          'resources could be upgraded to HTTPS. If a third-party resource is ' +
          'not upgradeable, you may want to contact the site owner.',
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
      preserveHost: true
    }
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

    return Promise.all(computedArtifacts)
        .then(([defaultRecords, mixedContentRecords]) => {

      // Filter the default pass records into "insecure" and "secure".
      var insecureRecords = defaultRecords
        .filter(record => !MixedContent.isSecureRecord(record)); // TODO: Also filter to only _successful_ records?
      var secureRecords = defaultRecords
        .filter(record => MixedContent.isSecureRecord(record));

      const successfulRecords = mixedContentRecords.filter(record => record.finished);
      const failedRecords = mixedContentRecords.filter(record => !record.finished);

      // var secureHosts = new Set();
      // var insecureHosts = new Set();
      // for (let [id, response] of artifacts.MixedContent.responses) {
      //   let responseUrl = new URL(response.url);
      //   // console.log(response);
      //   if (response.status >= 200 && response.status < 300 && response.securityState === 'secure') {
      //     // console.log("SECURE");
      //     secureHosts.add(responseUrl.host);
      //   }
      // }

      var secureHosts = new Set();
      successfulRecords.filter(record => MixedContent.isSecureRecord(record))
        .forEach(secureRecord => {
          secureHosts.add(new URL(secureRecord.url).hostname);
        });

      // "Upgradeable" is the intersection of insecure successfulSecure.
      // let debugMap = {};
      // let numUpgradeable = 0;
      let resources = [];
      let upgradeableResources = [];
      var seen = new Set();
      const insecureUrls = insecureRecords.filter(record => {
        var url = this.simplifyURL(record.url);
        return seen.has(url) ? false : seen.add(url);
      });

      
      // TODO: Group requests by hostname and report # insecure requests to each host
      // and whether that host is upgradeable.
      insecureUrls.forEach(record => {
        var resource = {
          host: new URL(record.url).hostname,
          url: this.displayURL(record.url),
          full: record.url,
          initiator: this.displayURL(record._documentURL),
          // type: record._initiator.type,
          canUpgrade: 'No'
        };
        if (secureHosts.has(resource.host)) {
          resource.canUpgrade = 'Yes';
          // numUpgradeable += 1;
          upgradeableResources.push(resource);
          // debugMap[record.url] = true;
        } else {
          resources.push(resource);
          // debugMap[record.url] = false;
        }
      });

      // Place upgradeable resources first in the list.
      resources = upgradeableResources.concat(resources);

      let displayValue = `${Util.formatNumber(insecureUrls.length)} insecure `;
      displayValue += insecureRecords.length === 1 ? 'request found,\n' : 'requests found,\n';
      displayValue += `${Util.formatNumber(upgradeableResources.length)} upgradeable `;
      displayValue += upgradeableResources.length === 1 ? 'request found' : 'requests found';

      // if (insecureRecords.length > 1) {
      //   displayValue = `${Util.formatNumber(insecureUrls.length)} insecure requests found,\n`;
      // } else if (insecureRecords.length === 1) {
      //   displayValue = `${Util.formatNumber(insecureUrls.length)} insecure request found,\n`;
      // }
      
      // if (numUpgradeable != 1) {
      //   displayValue += `${Util.formatNumber(upgradeableResources.length)} upgradeable requests found`;
      // } else if (numUpgradeable === 1) {
      //   displayValue += `${Util.formatNumber(upgradeableResources.length)} upgradeable request found`;
      // }

      const headings = [
        {key: 'host', itemType: 'text', text: 'Hostname'},
        {key: 'full', itemType: 'url', text: 'Full URL'},
        {key: 'initiator', itemType: 'text', text: 'Initiator'},
        // {key: 'type', itemType: 'text', text: 'Type'},
        {key: 'canUpgrade', itemType: 'text', text: 'Upgradeable?'}
      ];
      const details = Audit.makeTableDetails(headings, resources);

      const totalRecords = insecureRecords.length + secureRecords.length;
      const score = 100 * (secureRecords.length + 0.5 * upgradeableResources.length) / totalRecords;

      // let debugString = '';
      // Object.keys(debugMap).forEach(key => {
      //   debugString += `${key}: ${debugMap[key]}\n`;
      // });

      return {
        rawValue: score,
        displayValue: displayValue,
        details
      };
    });
  }
}

module.exports = MixedContent;
