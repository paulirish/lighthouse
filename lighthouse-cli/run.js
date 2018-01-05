/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-disable no-console */

const path = require('path');

const Printer = require('./printer');
const ChromeLauncher = require('chrome-launcher');

const yargsParser = require('yargs-parser');
const lighthouse = require('../lighthouse-core/index.js');
const log = require('lighthouse-logger');
const getFilenamePrefix = require('../lighthouse-core/lib/file-namer.js').getFilenamePrefix;
const assetSaver = require('../lighthouse-core/lib/asset-saver.js');

const opn = require('opn');

const _RUNTIME_ERROR_CODE = 1;
const _PROTOCOL_TIMEOUT_EXIT_CODE = 67;

/**
 * exported for testing
 * @param {string} flags
 * @return {!Array<string>}
 */
function parseChromeFlags(flags = '') {
  const parsed = yargsParser(
      flags, {configuration: {'camel-case-expansion': false, 'boolean-negation': false}});

  return Object
      .keys(parsed)
      // Remove unnecessary _ item provided by yargs,
      .filter(key => key !== '_')
      // Avoid '=true', then reintroduce quotes
      .map(key => {
        if (parsed[key] === true) return `--${key}`;
        // ChromeLauncher passes flags to Chrome as atomic arguments, so do not double quote
        // i.e. `lighthouse --chrome-flags="--user-agent='My Agent'"` becomes `chrome "--user-agent=My Agent"`
        // see https://github.com/GoogleChrome/lighthouse/issues/3744
        return `--${key}=${parsed[key]}`;
      });
}

/**
 * Attempts to connect to an instance of Chrome with an open remote-debugging
 * port. If none is found, launches a debuggable instance.
 * @param {!LH.Flags} flags
 * @return {!Promise<!LH.LaunchedChrome>}
 */
function getDebuggableChrome(flags) {
  return ChromeLauncher.launch({
    port: flags.port,
    chromeFlags: parseChromeFlags(flags.chromeFlags),
    logLevel: flags.logLevel,
  });
}

function showConnectionError() {
  console.error('Unable to connect to Chrome');
  process.exit(_RUNTIME_ERROR_CODE);
}

/**
 * @param {!LH.LighthouseError} err
 */
function showRuntimeError(err) {
  console.error('Runtime error encountered:', err);
  if (err.stack) {
    console.error(err.stack);
  }
  process.exit(_RUNTIME_ERROR_CODE);
}

function showProtocolTimeoutError() {
  console.error('Debugger protocol timed out while connecting to Chrome.');
  process.exit(_PROTOCOL_TIMEOUT_EXIT_CODE);
}

function showPageLoadError() {
  console.error('Unable to load the page. Please verify the url you are trying to review.');
  process.exit(_RUNTIME_ERROR_CODE);
}

/**
 * @param {!LH.LighthouseError} err
 */
function handleError(err) {
  if (err.code === 'PAGE_LOAD_ERROR') {
    showPageLoadError();
  } else if (err.code === 'ECONNREFUSED') {
    showConnectionError();
  } else if (err.code === 'CRI_TIMEOUT') {
    showProtocolTimeoutError();
  } else {
    showRuntimeError(err);
  }
}

/**
 * @param {!LH.Results} results
 * @param {!Object} artifacts
 * @param {!LH.Flags} flags
 * @return {!Promise<void>}
 */
function saveResults(results, artifacts, flags) {
  const shouldSaveResults = flags.auditMode || (flags.gatherMode == flags.auditMode);
  if (!shouldSaveResults) return Promise.resolve();

  let promise = Promise.resolve(results);
  const cwd = process.cwd();

  // Use the output path as the prefix for all generated files.
  // If no output path is set, generate a file prefix using the URL and date.
  const configuredPath = !flags.outputPath || flags.outputPath === 'stdout' ?
      getFilenamePrefix(results) :
      flags.outputPath.replace(/\.\w{2,4}$/, '');
  const resolvedPath = path.resolve(cwd, configuredPath);

  if (flags.saveAssets) {
    promise = promise.then(_ => assetSaver.saveAssets(artifacts, results.audits, resolvedPath));
  }

  return promise.then(_ => {
    if (Array.isArray(flags.output)) {
      return flags.output.reduce((innerPromise, outputType) => {
        const extension = outputType === 'domhtml' ? 'html' : outputType;
        const outputPath = `${resolvedPath}.report.${extension}`;
        return innerPromise.then(() => Printer.write(results, outputType, outputPath));
      }, Promise.resolve());
    } else {
      const extension = flags.output === 'domhtml' ? 'html' : flags.output;
      const outputPath =
          flags.outputPath || `${resolvedPath}.report.${extension}`;
      return Printer.write(results, flags.output, outputPath).then(_ => {
        if (flags.output === Printer.OutputMode[Printer.OutputMode.html] ||
            flags.output === Printer.OutputMode[Printer.OutputMode.domhtml]) {
          if (flags.view) {
            opn(outputPath, {wait: false});
          } else {
            log.log(
                'CLI',
                // eslint-disable-next-line max-len
                'Protip: Run lighthouse with `--view` to immediately open the HTML report in your browser');
          }
        }
      });
    }
  });
}

/**
 * @param {string} url
 * @param {!LH.Flags} flags
 * @param {!LH.Config|undefined} config
 * @return {!Promise<!LH.Results|void>}
 */
function runLighthouse(url, flags, config) {
  /** @type {!LH.LaunchedChrome} */
  let launchedChrome;
  const shouldGather = flags.gatherMode || flags.gatherMode == flags.auditMode;
  let promise = Promise.resolve();

  if (shouldGather) {
    promise = promise.then(_ =>
      getDebuggableChrome(flags).then(launchedChromeInstance => {
        launchedChrome = launchedChromeInstance;
        flags.port = launchedChrome.port;
      })
    );
  }
  promise = promise.then(_ => {
    return lighthouse(url, flags, config).then(results => {
      return potentiallyKillChrome().then(_ => results);
    });
  });

  promise = promise.then(results => {
    const artifacts = results.artifacts;
    delete results.artifacts;
    return saveResults(results, artifacts, flags).then(_ => results);
  });

  return promise.catch(err => {
    return Promise.resolve()
      .then(_ => potentiallyKillChrome())
      .then(_ => handleError(err));
  });

  /**
   * @return {!Promise<{}>}
   */
  function potentiallyKillChrome() {
    if (launchedChrome !== undefined) {
      // TODO: keeps tsc happy (erases return type) but is useless.
      return launchedChrome.kill().then(_ => {});
    }
    return Promise.resolve({});
  }
}

module.exports = {
  parseChromeFlags,
  saveResults,
  runLighthouse,
};
