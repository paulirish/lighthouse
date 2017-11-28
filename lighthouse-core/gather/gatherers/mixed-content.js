/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Gatherer = require('./gatherer');
const URL = require('../../lib/url-shim');

/**
 * @param {string} str
 * @return {string}
 */
const btoa = function(str) {
  return Buffer.from(str, 'utf8').toString('base64');
};

/**
 * This gatherer sets the Network requestInterceptor so that it can intercept
 * every HTTP request and send an HTTP 302 Found redirect back to redirect the
 * request to HTTPS (this is done instead of upgrading the URL in place as that
 * would be invisible to the client and the network records). The corresponding
 * audit tries to determine what mixed content is able to switch to HTTPS and
 * which is not.
 * 
 * The limitation of this approach is that it works best for testing HTTP pages.
 * For pages that are HTTPS, it will fail to test any active mixed content
 * (e.g. JavaScript) as it will be blocked before it can be intercepted.
 */
class MixedContent extends Gatherer {
  constructor() {
    super();
    this._idsSeen = new Set();
    this._baseUrl = undefined;
  }

  /**
   * @param {string} url
   * @return {string}
   */
  upgradeURL(url) {
    const parsedURL = new URL(url);
    parsedURL.protocol = 'https:';
    return parsedURL.href;
  }

  /**
   * @param {string} url
   * @return {string}
   */
  downgradeURL(url) {
    const parsedURL = new URL(url);
    parsedURL.protocol = 'http:';
    return parsedURL.href;
  }

  _onRequestIntercepted(driver, event) {
    // Track requests the gatherer has already seen so we can try at-most-once
    // to upgrade each. This avoids repeatedly intercepting a request if it gets
    // downgraded back to HTTP.
    if (event.request.url !== this._baseUrl &&
        !this._idsSeen.has(event.interceptionId)) {
      this._idsSeen.add(event.interceptionId);
      event.request.url = this.upgradeURL(event.request.url);
      driver.sendCommand('Network.continueInterceptedRequest', {
        interceptionId: event.interceptionId,
        rawResponse: btoa(
            `HTTP/1.1 302 Found\r\nLocation: ${event.request.url}\r\n\r\n`),
      });
    } else {
      driver.sendCommand('Network.continueInterceptedRequest', {
        interceptionId: event.interceptionId,
      });
    }
  }

  beforePass(options) {
    const driver = options.driver;

    // The base URL can be brittle under redirects of the page, but the worst
    // case is the gatherer accidentally upgrades the final base URL to
    // HTTPS and loses the ability to check upgrading active mixed content.
    options.url = this.downgradeURL(options.url);
    this._baseUrl = options.url;

    driver.sendCommand('Network.enable', {});
    driver.on(
      'Network.requestIntercepted',
      this._onRequestIntercepted.bind(this, driver));
    driver.sendCommand('Network.setCacheDisabled', {cacheDisabled: true});
    driver.sendCommand(
      'Network.setRequestInterception',
      {patterns: [{urlPattern: 'http://*/*'}]});
  }

  afterPass(options, _) {
    const driver = options.driver;
    return Promise.resolve().then(_ => driver.sendCommand(
        'Network.setRequestInterception', {patterns: []})
    ).then(_ => driver.off(
        'Network.requestIntercepted',
        this._onRequestIntercepted.bind(this, driver))
    ).then(driver.sendCommand(
        'Network.setCacheDisabled', {cacheDisabled: false})
    ).then(_ => {
      return {};
    });
  }
}

module.exports = MixedContent;
