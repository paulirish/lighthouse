/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
// @ts-nocheck
'use strict';

const Driver = require('./gather/driver.js');
const GatherRunner = require('./gather/gather-runner');
const ReportScoring = require('./scoring');
const Audit = require('./audits/audit');
const emulation = require('./lib/emulation');
const log = require('lighthouse-logger');
const assetSaver = require('./lib/asset-saver');
const fs = require('fs');
const path = require('path');
const URL = require('./lib/url-shim');
const Sentry = require('./lib/sentry');

const basePath = path.join(process.cwd(), 'latest-run');

class Runner {
  static run(connection, opts) {
    debugger;
    // Clean opts input.
    opts.flags = opts.flags || {};

    const config = opts.config;

    // List of top-level warnings for this Lighthouse run.
    const lighthouseRunWarnings = [];

    // save the initialUrl provided by the user
    opts.initialUrl = opts.url;
    if (typeof opts.initialUrl !== 'string' || opts.initialUrl.length === 0) {
      return Promise.reject(new Error('You must provide a url to the runner'));
    }

    let parsedURL;
    try {
      parsedURL = new URL(opts.url);
    } catch (e) {
      const err = new Error('The url provided should have a proper protocol and hostname.');
      return Promise.reject(err);
    }

    const sentryContext = Sentry.getContext();
    Sentry.captureBreadcrumb({
      message: 'Run started',
      category: 'lifecycle',
      data: sentryContext && sentryContext.extra,
    });

    // If the URL isn't https and is also not localhost complain to the user.
    if (parsedURL.protocol !== 'https:' && parsedURL.hostname !== 'localhost') {
      log.warn('Lighthouse', 'The URL provided should be on HTTPS');
      log.warn('Lighthouse', 'Performance stats will be skewed redirecting from HTTP to HTTPS.');
    }

    // canonicalize URL with any trailing slashes neccessary
    opts.url = parsedURL.href;

    // Make a run, which can be .then()'d with whatever needs to run (based on the config).
    let run = Promise.resolve();

    // User can run -G solo, -A solo, or -GA together
    const shouldGatherAndQuit = opts.flags.gatherMode && !opts.flags.auditMode;
    const shouldOnlyAudit = opts.flags.auditMode && !opts.flags.gatherMode;
    const shouldDefaultRunButSaveArtifacts = opts.flags.auditMode && opts.flags.gatherMode;
    const shouldDoTypicalRun = !opts.flags.gatherMode && !opts.flags.auditMode;

    const shouldSaveArtifactsToDisk = shouldGatherAndQuit || shouldDefaultRunButSaveArtifacts;
    const shouldLoadArtifactsFromDisk = shouldOnlyAudit;
    const shouldGatherFromBrowser = config.passes && !config.artifacts && (shouldGatherAndQuit || shouldDefaultRunButSaveArtifacts || shouldDoTypicalRun);

    if (shouldLoadArtifactsFromDisk) {
      config.removePasses();
      run = run.then(_ => {
        return assetSaver.loadArtifacts(basePath).then(artifacts => config._artifacts = artifacts);
      });
    }

    // Entering: Gather phase
    if (!config.passes && !config.artifacts && !shouldLoadArtifactsFromDisk) {
      const err = new Error('You must require either gather passes or provide saved artifacts.');
      return Promise.reject(err);
    }

    // If we're gathering, let's go collect artifacts from the browser
    if (shouldGatherFromBrowser) {
      opts.driver = opts.driverMock || new Driver(connection);
      // Kick off the gather run
      run = run.then(_ => GatherRunner.run(config.passes, opts));
      // Potentially quit now if we ran -G (but not -GA)
      if (shouldSaveArtifactsToDisk) {
        run = run.then(artifacts => assetSaver.saveArtifacts(artifacts, basePath).then(_ => {}));
      }
      if (shouldGatherAndQuit) return run;
    }

    // Entering: Audit phase
    if (!config.audits) {
      const err = new Error(
          'The run cannot continue as the config has defined no audits to evaluate.');
      return Promise.reject(err);
    }

    // Run the audits
    run = run.then(artifacts => {
      log.log('status', 'Analyzing and running audits...');
      artifacts = Object.assign(Runner.instantiateComputedArtifacts(), artifacts || config.artifacts);

      // Bring in lighthouseRunWarnings from gathering stage.
      if (artifacts.LighthouseRunWarnings) {
        lighthouseRunWarnings.push(...artifacts.LighthouseRunWarnings);
      }
      // Run each audit sequentially
      const promises = config.audits.map(audit => Runner._runAudit(audit, artifacts));
      return Promise.all(promises).then(auditResults => ({artifacts, auditResults}));
    });

    // Entering: Conclusion of the lighthouse result object
    run = run
      .then(runResults => {
        log.log('status', 'Generating results...');

        const resultsById = runResults.auditResults.reduce((results, audit) => {
          results[audit.name] = audit;
          return results;
        }, {});

        let reportCategories = [];
        let score = 0;
        if (config.categories) {
          const report = ReportScoring.scoreAllCategories(config, resultsById);
          reportCategories = report.categories;
          score = report.score;
        }

        return {
          userAgent: runResults.artifacts.UserAgent,
          lighthouseVersion: require('../package').version,
          generatedTime: (new Date()).toJSON(),
          initialUrl: opts.initialUrl,
          url: opts.url,
          runWarnings: lighthouseRunWarnings,
          audits: resultsById,
          artifacts: runResults.artifacts,
          runtimeConfig: Runner.getRuntimeConfig(opts.flags),
          score,
          reportCategories,
          reportGroups: config.groups,
        };
      })
      .catch(err => {
        return Sentry.captureException(err, {level: 'fatal'}).then(() => {
          throw err;
        });
      });

    return run;
  }


  /**
   * Checks that the audit's required artifacts exist and runs the audit if so.
   * Otherwise returns error audit result.
   * @param {!Audit} audit
   * @param {!Artifacts} artifacts
   * @return {!Promise<!AuditResult>}
   * @private
   */
  static _runAudit(audit, artifacts) {
    const status = `Evaluating: ${audit.meta.description}`;

    return Promise.resolve().then(_ => {
      log.log('status', status);

      // Return an early error if an artifact required for the audit is missing or an error.
      for (const artifactName of audit.meta.requiredArtifacts) {
        const noArtifact = typeof artifacts[artifactName] === 'undefined';

        // If trace required, check that DEFAULT_PASS trace exists.
        // TODO: need pass-specific check of networkRecords and traces.
        const noTrace = artifactName === 'traces' && !artifacts.traces[Audit.DEFAULT_PASS];

        if (noArtifact || noTrace) {
          log.warn('Runner',
              `${artifactName} gatherer, required by audit ${audit.meta.name}, did not run.`);
          throw new Error(`Required ${artifactName} gatherer did not run.`);
        }

        // If artifact was an error, it must be non-fatal (or gatherRunner would
        // have thrown). Output error result on behalf of audit.
        if (artifacts[artifactName] instanceof Error) {
          const artifactError = artifacts[artifactName];
          Sentry.captureException(artifactError, {
            tags: {gatherer: artifactName},
            level: 'error',
          });

          log.warn('Runner', `${artifactName} gatherer, required by audit ${audit.meta.name},` +
            ` encountered an error: ${artifactError.message}`);

          // Create a friendlier display error and mark it as expected to avoid duplicates in Sentry
          const error = new Error(
              `Required ${artifactName} gatherer encountered an error: ${artifactError.message}`);
          error.expected = true;
          throw error;
        }
      }
      // all required artifacts are in good shape, so we proceed
      return audit.audit(artifacts);
    // Fill remaining audit result fields.
    }).then(auditResult => Audit.generateAuditResult(audit, auditResult))
    .catch(err => {
      log.warn(audit.meta.name, `Caught exception: ${err.message}`);
      if (err.fatal) {
        throw err;
      }

      Sentry.captureException(err, {tags: {audit: audit.meta.name}, level: 'error'});
      // Non-fatal error become error audit result.
      return Audit.generateErrorAuditResult(audit, 'Audit error: ' + err.message);
    }).then(result => {
      log.verbose('statusEnd', status);
      return result;
    });
  }

  /**
   * Returns list of audit names for external querying.
   * @return {!Array<string>}
   */
  static getAuditList() {
    const ignoredFiles = [
      'audit.js',
      'violation-audit.js',
      'accessibility/axe-audit.js',
      'multi-check-audit.js',
      'byte-efficiency/byte-efficiency-audit.js',
      'manual/manual-audit.js',
    ];

    const fileList = [
      ...fs.readdirSync(path.join(__dirname, './audits')),
      ...fs.readdirSync(path.join(__dirname, './audits/dobetterweb')).map(f => `dobetterweb/${f}`),
      ...fs.readdirSync(path.join(__dirname, './audits/seo')).map(f => `seo/${f}`),
      ...fs.readdirSync(path.join(__dirname, './audits/accessibility'))
          .map(f => `accessibility/${f}`),
      ...fs.readdirSync(path.join(__dirname, './audits/accessibility/manual'))
          .map(f => `accessibility/manual/${f}`),
      ...fs.readdirSync(path.join(__dirname, './audits/byte-efficiency'))
          .map(f => `byte-efficiency/${f}`),
      ...fs.readdirSync(path.join(__dirname, './audits/manual')).map(f => `manual/${f}`),
    ];
    return fileList.filter(f => {
      return /\.js$/.test(f) && !ignoredFiles.includes(f);
    }).sort();
  }

  /**
   * Returns list of gatherer names for external querying.
   * @return {!Array<string>}
   */
  static getGathererList() {
    const fileList = [
      ...fs.readdirSync(path.join(__dirname, './gather/gatherers')),
      ...fs.readdirSync(path.join(__dirname, './gather/gatherers/seo')).map(f => `seo/${f}`),
      ...fs.readdirSync(path.join(__dirname, './gather/gatherers/dobetterweb'))
          .map(f => `dobetterweb/${f}`),
    ];
    return fileList.filter(f => /\.js$/.test(f) && f !== 'gatherer.js').sort();
  }

  /**
   * @return {!ComputedArtifacts}
   */
  static instantiateComputedArtifacts() {
    const computedArtifacts = {};
    const filenamesToSkip = [
      'computed-artifact.js', // the base class which other artifacts inherit
    ];

    require('fs').readdirSync(__dirname + '/gather/computed').forEach(function(filename) {
      if (filenamesToSkip.includes(filename)) return;

      // Drop `.js` suffix to keep browserify import happy.
      filename = filename.replace(/\.js$/, '');
      const ArtifactClass = require('./gather/computed/' + filename);
      const artifact = new ArtifactClass(computedArtifacts);
      // define the request* function that will be exposed on `artifacts`
      computedArtifacts['request' + artifact.name] = artifact.request.bind(artifact);
    });
    return computedArtifacts;
  }

  /**
   * Resolves the location of the specified plugin and returns an absolute
   * string path to the file. Used for loading custom audits and gatherers.
   * Throws an error if no plugin is found.
   * @param {string} plugin
   * @param {string=} configDir The absolute path to the directory of the config file, if there is one.
   * @param {string=} category Optional plugin category (e.g. 'audit') for better error messages.
   * @return {string}
   * @throws {Error}
   */
  static resolvePlugin(plugin, configDir, category) {
    // First try straight `require()`. Unlikely to be specified relative to this
    // file, but adds support for Lighthouse plugins in npm modules as
    // `require()` walks up parent directories looking inside any node_modules/
    // present. Also handles absolute paths.
    try {
      return require.resolve(plugin);
    } catch (e) {}

    // See if the plugin resolves relative to the current working directory.
    // Most useful to handle the case of invoking Lighthouse as a module, since
    // then the config is an object and so has no path.
    const cwdPath = path.resolve(process.cwd(), plugin);
    try {
      return require.resolve(cwdPath);
    } catch (e) {}

    const errorString = 'Unable to locate ' +
        (category ? `${category}: ` : '') +
        `${plugin} (tried to require() from '${__dirname}' and load from '${cwdPath}'`;

    if (!configDir) {
      throw new Error(errorString + ')');
    }

    // Finally, try looking up relative to the config file path. Just like the
    // relative path passed to `require()` is found relative to the file it's
    // in, this allows plugin paths to be specified relative to the config file.
    const relativePath = path.resolve(configDir, plugin);
    try {
      return require.resolve(relativePath);
    } catch (requireError) {}

    throw new Error(errorString + ` and '${relativePath}')`);
  }

  /**
   * Get runtime configuration specified by the flags
   * @param {!Object} flags
   * @return {!Object} runtime config
   */
  static getRuntimeConfig(flags) {
    const emulationDesc = emulation.getEmulationDesc();
    const environment = [
      {
        name: 'Device Emulation',
        enabled: !flags.disableDeviceEmulation,
        description: emulationDesc['deviceEmulation'],
      },
      {
        name: 'Network Throttling',
        enabled: !flags.disableNetworkThrottling,
        description: emulationDesc['networkThrottling'],
      },
      {
        name: 'CPU Throttling',
        enabled: !flags.disableCpuThrottling,
        description: emulationDesc['cpuThrottling'],
      },
    ];

    return {environment, blockedUrlPatterns: flags.blockedUrlPatterns || []};
  }
}

module.exports = Runner;
