/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Gatherer = require('./gatherer');
//const DOMHelpers = require('../../lib/dom-helpers.js');


/**
 * This gatherer sets the Network requestInterceptor so that we can
 * capture all requests, change them to HTTPS, and pass them along. In the audit
 * we try to determine what mixed content is able to switch to HTTPS and which
 * isn't.
 * 
 * The limitation of this approach is that it works best for testing HTTP pages.
 * For pages that are HTTPS, it will fail to test any active mixed content
 * (e.g. JavaScript).
 */
class MixedContent extends Gatherer {
  constructor() {
    super();
    this._preRedirectUrl;
    this._urlsSeen = new Set();
  }
  // TODO(cthomp): Current problem is that if a site re-directs back to HTTP, we will continue
  // re-intercepting the request repeatedly (and often crash). Maybe we can track a list of 
  // requests we've already seen so we can try at-most-once to upgrade each.
  // The baseUrl is also very brittle under redirects of the page -- can we step through redirects
  // at all here to avoid that? Will this be handled by the at-most-once check?
  // (Other concern: We want the main page to be HTTP, so if an upgrade is possible, we then lose
  // active-mixed-content upgrade checking.)
  _onRequestIntercepted(driver, event) {
    if (!this._urlsSeen.has(event.request.url)) {
    // if (event.request.url != baseUrl) {
        console.log(`*Upgrading a request: ${event.request.url}`);
        this._urlsSeen.add(event.request.url);
        event.request.url = event.request.url.replace(/^http:\/\//, 'https://');
    } else {
      console.log(`[Already seen url: ${event.request.url}]`);
    }  // Don't upgrade main URL.
    driver.sendCommand('Network.continueInterceptedRequest', {
      interceptionId: event.interceptionId, url: event.request.url
    });
  }

  beforePass(options) {
    const driver = options.driver;
    // const baseUrl = options.url;
    this._urlsSeen.add(options.url);
    driver.sendCommand('Network.enable', {});
    driver.on('Network.requestIntercepted', this._onRequestIntercepted.bind(this, driver));
    // driver.sendCommand('Network.setCacheDisabled', {cacheDisabled: true});
    driver.sendCommand('Network.setRequestInterception', {patterns: [{urlPattern: "http://*/*"}]});
  }

  afterPass(options, traceData) {
    // Get a list of successful and unsuccessful requests.
    // "Unsuccessful" is a heuristic for "not available on HTTPS".
    // "Successful" means it is available.
    // We can then compare to the default-pass to determine:
    // - Requests that were HTTP by default but succeeded as HTTPS
    // ("UPGRADABLE")
    // - Requests that were HTTP by default but failed as HTTPS ("BLOCKER")
    const driver = options.driver;
    const baseUrl = options.url;
    return Promise.resolve()
        .then(_ => driver.sendCommand('Network.setRequestInterception', {patterns: []}))
        .then(_ => driver.off('Network.requestIntercepted', this._onRequestIntercepted.bind(this, driver)))
        .then(_ => { return {
            'successfulRecords': traceData.networkRecords.filter(record => record.finished),
            'failedRecords': traceData.networkRecords.filter(record => !record.finished)
          }
        });
  }
}

module.exports = MixedContent;
