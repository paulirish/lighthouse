/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const URL = require('../lib/url-shim.js');
const Audit = require('./audit.js');

class ServiceWorker extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'service-worker',
      title: 'Registers a service worker that controls page and start_url',
      failureTitle: 'Does not register a service worker that controls page and start_url',
      description: 'The service worker is the technology that enables your app to use many ' +
         'Progressive Web App features, such as offline, add to homescreen, and push ' +
         'notifications. [Learn more](https://developers.google.com/web/tools/lighthouse/audits/registered-service-worker).',
      requiredArtifacts: ['URL', 'ServiceWorker', 'WebAppManifest'],
    };
  }

  /**
   * Find active service workers for this origin.
   * @param {Array<LH.Crdp.ServiceWorker.ServiceWorkerVersion>} versions
   * @param {URL} pageUrl
   * @return {Array<LH.Crdp.ServiceWorker.ServiceWorkerVersion>}
   */
  static getVersionsForOrigin(versions, pageUrl) {
    return versions
      .filter(v => v.status === 'activated')
      .filter(v => new URL(v.scriptURL).origin === pageUrl.origin);
  }

  /**
   * From the set of active service workers for this origin, find the controlling SW (if any)
   * and return its scope URL.
   * @param {Array<LH.Crdp.ServiceWorker.ServiceWorkerVersion>} matchingSWVersions
   * @param {Array<LH.Crdp.ServiceWorker.ServiceWorkerRegistration>} registrations
   * @param {URL} pageUrl
   * @return {string|undefined}
   */
  static getControllingScopeUrl(matchingSWVersions, registrations, pageUrl) {
    // Find the normalized scope URLs of possibly-controlling SWs.
    const matchingScopeUrls = matchingSWVersions
      .map(v => registrations.find(r => r.registrationId === v.registrationId))
      .filter(/** @return {r is LH.Crdp.ServiceWorker.ServiceWorkerRegistration} */ r => !!r)
      .map(r => new URL(r.scopeURL).href);

    // Find most-specific applicable scope, the one controlling the page.
    // See https://w3c.github.io/ServiceWorker/v1/#scope-match-algorithm
    const pageControllingScope = matchingScopeUrls
      .filter(scopeUrl => pageUrl.href.startsWith(scopeUrl))
      .sort((scopeA, scopeB) => scopeA.length - scopeB.length)
      .pop();

    return pageControllingScope;
  }

  /**
   * Returns a failure message if there is no start_url or if the start_url isn't
   * contolled by the scopeUrl.
   * @param {LH.Artifacts['WebAppManifest']} manifest
   * @param {string} scopeUrl
   * @return {string|undefined}
   */
  static checkStartUrl(manifest, scopeUrl) {
    if (!manifest) {
      return 'no start_url was found because no manifest was fetched';
    }
    if (!manifest.value) {
      return 'no start_url was found because manifest failed to parse as valid JSON';
    }

    const startUrl = manifest.value.start_url.value;
    if (!startUrl.startsWith(scopeUrl)) {
      return `the start_url ("${startUrl}") is not in the service worker's scope ("${scopeUrl}")`;
    }
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    // Match against artifacts.URL.finalUrl so audit accounts for any redirects.
    const pageUrl = new URL(artifacts.URL.finalUrl);
    const {versions, registrations} = artifacts.ServiceWorker;

    const versionsForOrigin = ServiceWorker.getVersionsForOrigin(versions, pageUrl);
    if (versionsForOrigin.length === 0) {
      return {
        rawValue: false,
      };
    }

    const controllingScopeUrl = ServiceWorker.getControllingScopeUrl(versionsForOrigin,
        registrations, pageUrl);
    if (!controllingScopeUrl) {
      return {
        rawValue: false,
        explanation: `This origin has one or more service workers, however the page ("${pageUrl.href}") is not in scope.`, // eslint-disable-line max-len
      };
    }

    const startUrlFailure = ServiceWorker.checkStartUrl(artifacts.WebAppManifest,
        controllingScopeUrl);
    if (startUrlFailure) {
      return {
        rawValue: false,
        explanation: `This page is controlled by a service worker, however ${startUrlFailure}.`,
      };
    }

    // SW controls both finalUrl and start_url.
    return {
      rawValue: true,
    };
  }
}

module.exports = ServiceWorker;
