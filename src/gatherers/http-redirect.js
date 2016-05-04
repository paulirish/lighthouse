/**
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const Gather = require('./gather');

class HTTPRedirect extends Gather {

  static _error(errorString) {
    return {
      redirectsHTTP: {
        raw: undefined,
        value: undefined,
        debugString: errorString
      }
    };
  }

  afterReloadPageLoad(options) {
    const driver = options.driver;
    const httpURL = options.url.replace(/^https/, 'http');

    // Redirect out to about:blank first, because HTTP -> HTTPS causes a hang, similar to the way
    // that Page.navigate vs Page.reload does. So we basically force the issue by going to
    // about:blank first. That way there's no confusion.
    return Promise.resolve()
      .then(_ => driver.gotoURL('about:blank', {waitForLoad: false}))
      .then(_ => driver.gotoURL(httpURL, {waitForLoad: true}))
      .then(_ => driver.getSecurityState())
      .then(data => {
        this.artifact = {
          redirectsHTTP: {
            value: data.schemeIsCryptographic
          }
        };
      });
  }
}

module.exports = HTTPRedirect;
