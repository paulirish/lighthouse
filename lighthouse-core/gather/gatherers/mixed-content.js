/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Gatherer = require('./gatherer');
const URL = require('../../lib/url-shim');

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
    this._idsSeen = new Set();
    this._urlsSeen = new Set();
    this._baseUrl;
  }

  upgradeURL(url) {
    let parsedURL = new URL(url);
    parsedURL.protocol = 'https:';
    console.log(`*UPGRADED: ${parsedURL.href}`);
    return parsedURL.href;
  }

  // Track a list of requests we've already seen so we can try at-most-once to upgrade each.
  // This avoids repeatedly intercepting a request if it gets downgraded back to HTTP.
  _onRequestIntercepted(driver, event) {
    if (!this._urlsSeen.has(event.request.url)) {
    // if (event.request.url != this._baseUrl && !this._idsSeen.has(event.interceptionId)) {
      console.log(`*Upgrading a request: ${event.request.url}`);
      // this._idsSeen.add(event.interceptionId);
      this._urlsSeen.add(event.request.url);
      event.request.url = this.upgradeURL(event.request.url); //.replace(/^http:\/\//, 'https://');
      driver.sendCommand('Network.continueInterceptedRequest', {
        interceptionId: event.interceptionId, url: event.request.url
      });
    } else {
      console.log(`[Already handled: ${event.request.url}]`);
      driver.sendCommand('Network.continueInterceptedRequest', {
          interceptionId: event.interceptionId, 
      });
    }
    
  }

  beforePass(options) {
    const driver = options.driver;
    // TODO(cthomp): The base URL is very brittle under redirects of the page. Can we step through
    // redirects at all here to avoid that (find the final URL)? The worst case is we accidentally upgrade
    // the final base URL to HTTPS and lose the ability to check upgrading active mixed content.
    this._urlsSeen.add(options.url);
    // this._baseUrl = options.url;
    driver.sendCommand('Network.enable', {});
    driver.on('Network.requestIntercepted', this._onRequestIntercepted.bind(this, driver));
    driver.sendCommand('Network.setCacheDisabled', {cacheDisabled: true});
    driver.sendCommand('Network.setRequestInterception', {patterns: [{urlPattern: "http://*/*"}]});
  }

  afterPass(options, traceData) {
    // Get a list of successful and unsuccessful requests.
    // "Unsuccessful" is a heuristic for "not available on HTTPS".
    // "Successful" means it is available.
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
