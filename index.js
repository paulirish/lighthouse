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

const defaultUrl = 'https://voice-memos.appspot.com';
const ChromeProtocol = require('./helpers/browser/driver');

const Auditor = require('./auditor');
const Gatherer = require('./gatherer');
const Aggregator = require('./aggregator');

const driver = new ChromeProtocol();
const gatherers = [
  require('./gatherers/url'),
  require('./gatherers/load'),
  require('./gatherers/https'),
  require('./gatherers/service-worker'),
  require('./gatherers/viewport'),
  require('./gatherers/theme-color'),
  require('./gatherers/html'),
  require('./gatherers/manifest')
];
const audits = [
  require('./audits/security/is-on-https'),
  require('./audits/offline/service-worker'),
  require('./audits/mobile-friendly/viewport'),
  require('./audits/performance/first-meaningful-paint'),
  require('./audits/manifest/exists'),
  require('./audits/manifest/background-color'),
  require('./audits/manifest/theme-color'),
  require('./audits/manifest/icons'),
  require('./audits/manifest/icons-192'),
  require('./audits/manifest/name'),
  require('./audits/manifest/short-name'),
  require('./audits/manifest/start-url'),
  require('./audits/html/theme-color')
];
const aggregators = [
  require('./aggregators/will-get-add-to-homescreen-prompt'),
  require('./aggregators/is-secure'),
  require('./aggregators/is-performant')
];
module.exports = function(opts) {
  const url = opts.url || defaultUrl;
  return Gatherer
      .gather(gatherers, {url, driver})
      .then(artifacts => Auditor.audit(artifacts, audits))
      .then(results => Aggregator.aggregate(aggregators, results))
      .catch(function(err) {
        console.log('error encountered', err);
        console.log(err.stack);
        throw err;
      });
};
