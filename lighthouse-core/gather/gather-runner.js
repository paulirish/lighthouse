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

const log = require('../lib/log.js');
const Audit = require('../audits/audit');

/**
 * Class that drives browser to load the page and runs gatherer lifecycle hooks.
 * Execution sequence when GatherRunner.run() is called:
 *
 * 1. Setup
 *   A. driver.connect()
 *   B. GatherRunner.setupDriver()
 *     i. beginEmulation
 *     ii. cleanAndDisableBrowserCaches
 *     iii. forceUpdateServiceWorkers
 *
 * 2. For each pass in the config:
 *   A. GatherRunner.beforePass()
 *     i. all gatherer's beforePass()
 *   B. GatherRunner.pass()
 *     i. GatherRunner.loadPage()
 *       a. navigate to about:blank
 *       b. beginTrace & beginNetworkCollect (if requested)
 *       c. navigate to options.url (and wait for onload)
 *     ii. all gatherer's pass()
 *   C. GatherRunner.afterPass()
 *     i. endTrace & endNetworkCollect (if requested)
 *     ii. all gatherer's afterPass()
 *
 * 3. Teardown
 *   A. reloadForCleanStateIfNeeded
 *   B. driver.disconnect()
 *   C. collect all artifacts and return them
 */
class GatherRunner {
  static loadPage(driver, options) {
    // Since a Page.reload command does not let a service worker take over, we
    // navigate away and then come back to reload. We do not `waitForLoad` on
    // about:blank since a page load event is never fired on it.
    return driver.gotoURL('about:blank')
      // Wait a bit for about:blank to "take hold" before switching back to the page.
      .then(_ => new Promise((resolve, reject) => setTimeout(resolve, 300)))
      // Begin tracing and network recording if required.
      .then(_ => options.config.trace && driver.beginTrace())
      .then(_ => options.config.network && driver.beginNetworkCollect())
      // Navigate.
      .then(_ => driver.gotoURL(options.url, {
        waitForLoad: true,
        disableJavaScript: !!options.disableJavaScript
      }));
  }

  static setupDriver(driver, options) {
    log.log('status', 'Initializing…');
    // Enable emulation if required.
    return Promise.resolve(options.flags.mobile && driver.beginEmulation())
      .then(_ => {
        return driver.cleanAndDisableBrowserCaches();
      }).then(_ => {
        // Force SWs to update on load.
        return driver.forceUpdateServiceWorkers();
      });
  }

  /**
   * Calls beforePass() on gatherers before navigation and before tracing has
   * started (if requested).
   * @param {!Object} options
   * @return {!Promise}
   */
  static beforePass(options) {
    const config = options.config;
    const gatherers = config.gatherers;

    return gatherers.reduce((chain, gatherer) => {
      return chain.then(_ => {
        return gatherer.beforePass(options);
      });
    }, Promise.resolve());
  }

  /**
   * Navigates to requested URL and then runs pass() on gatherers while trace
   * (if requested) is still being recorded.
   * @param {!Object} options
   * @return {!Promise}
   */
  static pass(options) {
    const driver = options.driver;
    const config = options.config;
    const gatherers = config.gatherers;
    let pass = Promise.resolve();

    if (config.loadPage) {
      pass = pass.then(_ => {
        const status = 'Loading page & waiting for onload';
        const gatherernames = gatherers.map(g => g.name).join(', ');
        log.log('status', status, gatherernames);
        return GatherRunner.loadPage(driver, options).then(_ => {
          log.log('statusEnd', status);
        });
      });
    }

    return gatherers.reduce((chain, gatherer) => {
      return chain.then(_ => gatherer.pass(options));
    }, pass);
  }

  /**
   * Ends tracing and collects trace data (if requested for this pass), and runs
   * afterPass() on gatherers with trace data passed in. Promise resolves with
   * object containing trace and network data.
   * @param {!Object} options
   * @return {!Promise}
   */
  static afterPass(options) {
    const driver = options.driver;
    const config = options.config;
    const gatherers = config.gatherers;
    const loadData = {traces: {}};
    let pass = Promise.resolve();

    if (config.trace) {
      pass = pass.then(_ => {
        log.log('status', 'Retrieving trace');
        return driver.endTrace();
      }).then(traceContents => {
        // Before Chrome 54.0.2816 (codereview.chromium.org/2161583004),
        // traceContents was an array of trace events. After this point,
        // traceContents is an object with a traceEvents property. Normalize
        // to new format.
        if (Array.isArray(traceContents)) {
          traceContents = {
            traceEvents: traceContents
          };
        }

        const traceName = config.traceName || Audit.DEFAULT_TRACE;
        loadData.traces[traceName] = traceContents;
        loadData.traceEvents = traceContents.traceEvents;
        log.verbose('statusEnd', 'Retrieving trace');
      });
    }

    if (config.network) {
      const status = 'Retrieving network records';
      pass = pass.then(_ => {
        log.log('status', status);
        return driver.endNetworkCollect();
      }).then(networkRecords => {
        loadData.networkRecords = networkRecords;
        log.verbose('statusEnd', status);
      });
    }

    pass = gatherers.reduce((chain, gatherer) => {
      const status = `Retrieving: ${gatherer.name}`;
      return chain.then(_ => {
        log.log('status', status);
        return gatherer.afterPass(options, loadData);
      }).then(ret => {
        log.verbose('statusEnd', status);
        return ret;
      });
    }, pass);

    // Resolve on loadData.
    return pass.then(_ => loadData);
  }

  static run(passes, options) {
    const driver = options.driver;
    const tracingData = {traces: {}};

    passes = GatherRunner.instantiateGatherers(passes);

    return driver.connect()
      .then(_ => GatherRunner.setupDriver(driver, options))

      // Run each pass
      .then(_ => {
        return passes.reduce((chain, config) => {
          const runOptions = Object.assign({}, options, {config});
          return chain
              .then(_ => GatherRunner.beforePass(runOptions))
              .then(_ => GatherRunner.pass(runOptions))
              .then(_ => GatherRunner.afterPass(runOptions))
              .then(loadData => {
                // Merge pass trace and network data into tracingData.
                config.trace && Object.assign(tracingData.traces, loadData.traces);
                config.network && (tracingData.networkRecords = loadData.networkRecords);
              });
        }, Promise.resolve());
      })
      .then(_ => {
        // We dont need to hold up the reporting for the reload/disconnect,
        // so we will not return a promise in here.
        driver.reloadForCleanStateIfNeeded(options).then(_ => {
          log.log('status', 'Disconnecting from browser...');
          driver.disconnect();
        });
      })
      .then(_ => {
        // Collate all the gatherer results.
        const artifacts = Object.assign({}, tracingData);
        passes.forEach(pass => {
          pass.gatherers.forEach(gatherer => {
            artifacts[gatherer.name] = gatherer.artifact;
          });
        });
        return artifacts;
      });
  }

  static getGathererClass(gatherer) {
    return require(`./gatherers/${gatherer}`);
  }

  static instantiateGatherers(passes) {
    return passes.map(pass => {
      pass.gatherers = pass.gatherers.map(gatherer => {
        // If this is already instantiated, don't do anything else.
        if (typeof gatherer !== 'string') {
          return gatherer;
        }

        const GathererClass = GatherRunner.getGathererClass(gatherer);
        return new GathererClass();
      });

      return pass;
    });
  }
}

module.exports = GatherRunner;
