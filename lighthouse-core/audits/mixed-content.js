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
          'load if your site uses HTTPS. [Learn more](https://example.org)',
      requiredArtifacts: ['MixedContent', 'devtoolsLogs', 'traces']
    };
  }

  /**
   * @param {{scheme: string, domain: string}} record
   * @return {boolean}
   */
  static isSecureRecord(record) {
    return SECURE_SCHEMES.includes(record.scheme) ||
           SECURE_SCHEMES.includes(record.protocol) ||
           SECURE_DOMAINS.includes(record.domain);
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    //const defaultRecords = artifacts.networkRecords[Audit.DEFAULT_PASS];
    //const devtoolsLogs = artifacts.devtoolsLogs[Audit.MIXED_CONTENT_PASS];
    const defaultLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const upgradeLogs = artifacts.devtoolsLogs[Audit.MIXED_CONTENT_PASS];
    
    const computedArtifacts = [
      artifacts.requestNetworkRecords(defaultLogs),
      artifacts.requestNetworkRecords(upgradeLogs),
    ];
    
    return Promise.all(computedArtifacts)
        .then(([defaultRecords, upgradedRecords]) => {
      
      // Filter the default pass records into "insecure" and "secure"
      const insecureRecords = defaultRecords
        .filter(record => !MixedContent.isSecureRecord(record));
        //.map(record => ({url: URL.elideDataURI(record.url)}));

      const secureRecords = defaultRecords
        .filter(record => MixedContent.isSecureRecord(record));
        //.map(record => ({url: URL.elideDataURI(record.url)}));

      // Extract the successful HTTPS upgrade and failed HTTPS upgrade
      const successfulRecords = upgradedRecords.filter(record => record.finished);
      const failedRecords = upgradedRecords.filter(record => !record.finished);
      //~ const successfulRecords = artifacts.MixedContent.successfulRecords;
      //~ const failedRecords = artifacts.MixedContent.failedRecords;

      // Filter successfulRecords to successfulSecure and successfulInsecure
      // (Some requests may have been downgraded)
      const successfulInsecureRecords = successfulRecords
        .filter(record => !MixedContent.isSecureRecord(record));
      const successfulSecureRecords = successfulRecords
        .filter(record => MixedContent.isSecureRecord(record));

      // UPGRADEABLE: Intersection of insecureRecords and successfulSecureRecords
      let numUpgradeable = 0;
      let resources = [];
      insecureRecords.forEach(defaultRecord => {
        var resource = {
          url: defaultRecord.url,
          canUpgrade: 'No',
          replacement: 'N/A'
        };
        var upgradedURL = defaultRecord.url.replace(/^http:\/\//, 'https://');
        successfulSecureRecords.forEach(secureRecord => {
          if (upgradedURL === secureRecord.url) {
            resource.canUpgrade = 'Yes';
            resource.replacement = secureRecord.url;
            numUpgradeable = numUpgradeable + 1;
          }
        });
        resources.push(resource);
      });

      // BLOCKERS: Everything remaining.
      // We can then report the lists of both (with guidance):
      // - You can upgrade x -> y
      // - Z does not appear to provide a version of x over HTTPS.
      //   You should contact Z or switch to a different provider.

      let displayValue = '';
      if (insecureRecords.length > 1) {
        displayValue = `${Util.formatNumber(insecureRecords.length)} insecure requests found,\
              ${Util.formatNumber(secureRecords.length)} secure requests found`;
      } else if (insecureRecords.length === 1) {
        displayValue = `${insecureRecords.length} insecure request found`;
      }

      // We want to end up with "resources" containing
      // {url: original, 'can-upgrade': if intersected with
      // successfulSecureRecords, 'replacement': matching url from
      // successfulSecure}

      const headings = [
        {key: 'url', itemType: 'text', text: 'URL'},
        {key: 'canUpgrade', itemType: 'text', text: 'Upgradeable?'},
        {key: 'replacement', itemType: 'text', text: 'Replacement'},
      ];
      const details = Audit.makeTableDetails(headings, resources);

      return {
        rawValue: insecureRecords.length === 0,
        displayValue: displayValue,
        details,
      };
    });
  }
}

module.exports = MixedContent;
