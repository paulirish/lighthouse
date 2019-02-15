/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const lighthouse = require('../lighthouse-core/index.js');
const RawProtocol = require('../lighthouse-core/gather/connections/raw.js');
const log = require('lighthouse-logger');

/** @typedef {import('../lighthouse-core/gather/connections/connection.js')} Connection */

/**
 * Return a version of the default config, filtered to only run the specified
 * categories.
 * @param {Array<string>} categoryIDs
 * @return {LH.Config.Json}
 */
function getDefaultConfigForCategories(categoryIDs) {
  return {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: categoryIDs,
    },
  };
}

/**
 * @param {RawProtocol.Port} port
 * @param {string} url
 * @param {LH.Flags} flags Lighthouse flags.
 * @param {Array<string>} categoryIDs Name values of categories to include.
 * @return {Promise<LH.RunnerResult|void>}
 */
function runLighthouseInWorker(port, url, flags, categoryIDs) {
  // Default to 'info' logging level.
  flags.logLevel = flags.logLevel || 'info';
  const config = getDefaultConfigForCategories(categoryIDs);
  const connection = new RawProtocol(port);

  return lighthouse(url, flags, config, connection);
}

/** @param {(status: [string, string, string]) => void} listenCallback */
function listenForStatus(listenCallback) {
  log.events.addListener('status', listenCallback);
}

if (typeof module !== 'undefined' && module.exports) {
  // export for require()ing (via browserify).
  module.exports = {
    runLighthouseInWorker,
    listenForStatus,
  };
}

// Expose only in DevTools' worker
// @ts-ignore
if (typeof self !== 'undefined') {
  // @ts-ignore
  self.runLighthouseInWorker = runLighthouseInWorker;
  // @ts-ignore
  self.listenForStatus = listenForStatus;
}
