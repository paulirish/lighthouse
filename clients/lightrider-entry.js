/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const lighthouse = require('../lighthouse-core/index.js');

const assetSaver = require('../lighthouse-core/lib/asset-saver.js');
const LHError = require('../lighthouse-core/lib/lh-error.js');
const preprocessor = require('../lighthouse-core/lib/proto-preprocessor.js');

/** @type {Record<'mobile'|'desktop', LH.Config.Json>} */
const LR_PRESETS = {
  mobile: require('../lighthouse-core/config/lr-mobile-config.js'),
  desktop: require('../lighthouse-core/config/lr-desktop-config.js'),
};

/** @typedef {import('../lighthouse-core/gather/connections/connection.js')} Connection */

/**
 * Run lighthouse for connection and provide similar results as in CLI.
 * @param {Connection} connection
 * @param {string} url
 * @param {LH.Flags} flags Lighthouse flags, including `output`
 * @param {{lrDevice?: 'desktop'|'mobile', categoryIDs?: Array<string>, logAssets: boolean}} lrOpts Options coming from Lightrider
 * @return {Promise<string|Array<string>|void>}
 */
async function runLighthouseInLR(connection, url, flags, {lrDevice, categoryIDs, logAssets}) {
  // Certain fixes need to kick in under LR, see https://github.com/GoogleChrome/lighthouse/issues/5839
  global.isLightRider = true;

  // disableStorageReset because it causes render server hang
  flags.disableStorageReset = true;
  flags.logLevel = flags.logLevel || 'info';
  const config = lrDevice === 'desktop' ? LR_PRESETS.desktop : LR_PRESETS.mobile;
  if (categoryIDs) {
    config.settings = config.settings || {};
    config.settings.onlyCategories = categoryIDs;
  }

  try {
    const results = await lighthouse(url, flags, config, connection);
    if (!results) return;

    if (logAssets) {
      await assetSaver.logAssets(results.artifacts, results.lhr.audits);
    }

    // pre process the LHR for proto
    if (flags.output === 'json' && typeof results.report === 'string') {
      return preprocessor.processForProto(results.report);
    }

    return results.report;
  } catch (err) {
    // If an error ruined the entire lighthouse run, attempt to return a meaningful error.
    let runtimeError;
    if (!(err instanceof LHError) || !err.lhrRuntimeError) {
      runtimeError = {
        code: LHError.UNKNOWN_ERROR,
        message: `Unknown error encountered with message '${err.message}'`,
      };
    } else {
      runtimeError = {
        code: err.code,
        message: err.friendlyMessage ?
            `${err.friendlyMessage} (${err.message})` :
            err.message,
      };
    }

    return JSON.stringify({runtimeError}, null, 2);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  // Export for require()ing into unit tests.
  module.exports = {
    runLighthouseInLR,
  };
}

// Expose on window for browser-residing consumers of file.
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.runLighthouseInLR = runLighthouseInLR;
}
