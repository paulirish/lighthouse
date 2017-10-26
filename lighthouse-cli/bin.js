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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const _SIGINT = 'SIGINT';
const _SIGINT_EXIT_CODE = 130;
const _RUNTIME_ERROR_CODE = 1;
const _PROTOCOL_TIMEOUT_EXIT_CODE = 67;
const assetSaver = require('../lighthouse-core/lib/asset-saver.js');
const getFilenamePrefix = require('../lighthouse-core/lib/file-namer.js').getFilenamePrefix;
const chrome_launcher_1 = require("./chrome-launcher");
const Commands = require("./commands/commands");
const lighthouse = require('../lighthouse-core');
const log = require('../lighthouse-core/lib/log');
const Driver = require('../lighthouse-core/gather/driver.js');
const path = require("path");
const perfOnlyConfig = require('../lighthouse-core/config/perf.json');
const performanceXServer = require('./performance-experiment/server');
const Printer = require("./printer");
const randomPort = require("./random-port");
const yargs = require('yargs');
const opn = require('opn');
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');
updateNotifier({ pkg }).notify(); // Tell user if there's a newer version of LH.
;
const cliFlags = yargs
    .help('help')
    .version(() => pkg.version)
    .showHelpOnFail(false, 'Specify --help for available options')
    .usage('$0 url')
    .group([
    'verbose',
    'quiet'
], 'Logging:')
    .describe({
    verbose: 'Displays verbose logging',
    quiet: 'Displays no progress, debug logs or errors'
})
    .group([
    'save-assets',
    'save-artifacts',
    'list-all-audits',
    'list-trace-categories',
    'additional-trace-categories',
    'config-path',
    'chrome-flags',
    'perf',
    'port',
    'max-wait-for-load'
], 'Configuration:')
    .describe({
    'disable-storage-reset': 'Disable clearing the browser cache and other storage APIs before a run',
    'disable-device-emulation': 'Disable Nexus 5X emulation',
    'disable-cpu-throttling': 'Disable CPU throttling',
    'disable-network-throttling': 'Disable network throttling',
    'save-assets': 'Save the trace contents & screenshots to disk',
    'save-artifacts': 'Save all gathered artifacts to disk',
    'list-all-audits': 'Prints a list of all available audits and exits',
    'list-trace-categories': 'Prints a list of all required trace categories and exits',
    'additional-trace-categories': 'Additional categories to capture with the trace (comma-delimited).',
    'config-path': 'The path to the config JSON.',
    'chrome-flags': 'Custom flags to pass to Chrome.',
    'perf': 'Use a performance-test-only configuration',
    'port': 'The port to use for the debugging protocol. Use 0 for a random port',
    'max-wait-for-load': 'The timeout (in milliseconds) to wait before the page is considered done loading and the run should continue. WARNING: Very high values can lead to large traces and instability',
    'skip-autolaunch': 'Skip autolaunch of Chrome when already running instance is not found',
    'select-chrome': 'Interactively choose version of Chrome to use when multiple installations are found',
    'interactive': 'Open Lighthouse in interactive mode'
})
    .group([
    'output',
    'output-path',
    'view'
], 'Output:')
    .describe({
    'output': `Reporter for the results, supports multiple values`,
    'output-path': `The file path to output the results. Use 'stdout' to write to stdout.
If using JSON output, default is stdout.
If using HTML output, default is a file in the working directory with a name based on the test URL and date.
If using multiple outputs, --output-path is ignored.
Example: --output-path=./lighthouse-results.html`,
    'view': 'Open HTML report in your browser'
})
    .boolean([
    'disable-storage-reset',
    'disable-device-emulation',
    'disable-cpu-throttling',
    'disable-network-throttling',
    'save-assets',
    'save-artifacts',
    'list-all-audits',
    'list-trace-categories',
    'perf',
    'view',
    'skip-autolaunch',
    'select-chrome',
    'verbose',
    'quiet',
    'help',
    'interactive'
])
    .choices('output', Printer.GetValidOutputOptions())
    .default('chrome-flags', '')
    .default('disable-cpu-throttling', false)
    .default('output', Printer.GetValidOutputOptions()[Printer.OutputMode.html])
    .default('port', 9222)
    .default('max-wait-for-load', Driver.MAX_WAIT_FOR_FULLY_LOADED)
    .check((argv) => {
    // Make sure lighthouse has been passed a url, or at least one of --list-all-audits
    // or --list-trace-categories. If not, stop the program and ask for a url
    if (!argv.listAllAudits && !argv.listTraceCategories && argv._.length === 0) {
        throw new Error('Please provide a url');
    }
    return true;
})
    .argv;
// Process terminating command
if (cliFlags.listAllAudits) {
    Commands.ListAudits();
}
// Process terminating command
if (cliFlags.listTraceCategories) {
    Commands.ListTraceCategories();
}
const url = cliFlags._[0];
let config = null;
if (cliFlags.configPath) {
    // Resolve the config file path relative to where cli was called.
    cliFlags.configPath = path.resolve(process.cwd(), cliFlags.configPath);
    config = require(cliFlags.configPath);
}
else if (cliFlags.perf) {
    config = perfOnlyConfig;
}
// set logging preferences
cliFlags.logLevel = 'info';
if (cliFlags.verbose) {
    cliFlags.logLevel = 'verbose';
}
else if (cliFlags.quiet) {
    cliFlags.logLevel = 'silent';
}
log.setLevel(cliFlags.logLevel);
if (cliFlags.output === Printer.OutputMode[Printer.OutputMode.json] && !cliFlags.outputPath) {
    cliFlags.outputPath = 'stdout';
}
/**
 * If the requested port is 0, set it to a random, unused port.
 */
function initPort(flags) {
    return Promise.resolve().then(() => {
        if (flags.port !== 0) {
            log.verbose('Lighthouse CLI', `Using supplied port ${flags.port}`);
            return;
        }
        log.verbose('Lighthouse CLI', 'Generating random port.');
        return randomPort.getRandomPort().then(portNumber => {
            flags.port = portNumber;
            log.verbose('Lighthouse CLI', `Using generated port ${flags.port}.`);
        });
    });
}
/**
 * Attempts to connect to an instance of Chrome with an open remote-debugging
 * port. If none is found and the `skipAutolaunch` flag is not true, launches
 * a debuggable instance.
 */
function getDebuggableChrome(flags) {
    const chromeLauncher = new chrome_launcher_1.ChromeLauncher({
        port: flags.port,
        additionalFlags: flags.chromeFlags.split(' '),
        autoSelectChrome: !flags.selectChrome,
    });
    // Kill spawned Chrome process in case of ctrl-C.
    process.on(_SIGINT, () => {
        chromeLauncher.kill().then(() => process.exit(_SIGINT_EXIT_CODE), handleError);
    });
    return chromeLauncher
        .isDebuggerReady()
        .catch(() => {
        if (flags.skipAutolaunch) {
            return;
        }
        // If not, create one.
        log.log('Lighthouse CLI', 'Launching Chrome...');
        return chromeLauncher.run();
    })
        .then(() => chromeLauncher);
}
function showConnectionError() {
    console.error('Unable to connect to Chrome');
    console.error('If you\'re using lighthouse with --skip-autolaunch, ' +
        'make sure you\'re running some other Chrome with a debugger.');
    process.exit(_RUNTIME_ERROR_CODE);
}
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
function handleError(err) {
    if (err.code === 'PAGE_LOAD_ERROR') {
        showPageLoadError();
    }
    else if (err.code === 'ECONNREFUSED') {
        showConnectionError();
    }
    else if (err.code === 'CRI_TIMEOUT') {
        showProtocolTimeoutError();
    }
    else {
        showRuntimeError(err);
    }
}
function saveResults(results, artifacts, flags) {
    let promise = Promise.resolve(results);
    const cwd = process.cwd();
    // Use the output path as the prefix for all generated files.
    // If no output path is set, generate a file prefix using the URL and date.
    const configuredPath = !flags.outputPath || flags.outputPath === 'stdout' ?
        getFilenamePrefix(results) : flags.outputPath.replace(/\.\w{2,4}$/, '');
    const resolvedPath = path.resolve(cwd, configuredPath);
    if (flags.saveArtifacts) {
        assetSaver.saveArtifacts(artifacts, resolvedPath);
    }
    if (flags.saveAssets) {
        promise = promise.then(_ => assetSaver.saveAssets(artifacts, results.audits, resolvedPath));
    }
    const typeToExtension = (type) => type === 'domhtml' ? 'dom.html' : type;
    return promise.then(_ => {
        if (Array.isArray(flags.output)) {
            return flags.output.reduce((innerPromise, outputType) => {
                const outputPath = `${resolvedPath}.report.${typeToExtension(outputType)}`;
                return innerPromise.then((_) => Printer.write(results, outputType, outputPath));
            }, Promise.resolve(results));
        }
        else {
            const outputPath = flags.outputPath ||
                `${resolvedPath}.report.${typeToExtension(flags.output)}`;
            return Printer.write(results, flags.output, outputPath).then(results => {
                if (flags.output === Printer.OutputMode[Printer.OutputMode.html] ||
                    flags.output === Printer.OutputMode[Printer.OutputMode.domhtml]) {
                    if (flags.view) {
                        opn(outputPath, { wait: false });
                    }
                    else {
                        log.log('CLI', 'Protip: Run lighthouse with `--view` to immediately open the HTML report in your browser');
                    }
                }
                return results;
            });
        }
    });
}
function runLighthouse(url, flags, config) {
    return __awaiter(this, void 0, void 0, function* () {
        let chromeLauncher = undefined;
        try {
            yield initPort(flags);
            const chromeLauncher = yield getDebuggableChrome(flags);
            const results = yield lighthouse(url, flags, config);
            const artifacts = results.artifacts;
            delete results.artifacts;
            yield saveResults(results, artifacts, flags);
            if (flags.interactive) {
                yield performanceXServer.hostExperiment({ url, flags, config }, results);
            }
            return yield chromeLauncher.kill();
        }
        catch (err) {
            if (typeof chromeLauncher !== 'undefined') {
                yield chromeLauncher.kill();
            }
            return handleError(err);
        }
    });
}
exports.runLighthouse = runLighthouse;
function run() {
    return runLighthouse(url, cliFlags, config);
}
exports.run = run;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYmluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7R0FlRztBQUNILFlBQVksQ0FBQzs7Ozs7Ozs7O0FBRWIsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDO0FBQ3pCLE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDO0FBQzlCLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO0FBQzlCLE1BQU0sMkJBQTJCLEdBQUcsRUFBRSxDQUFDO0FBRXZDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO0FBQ3BFLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLHNDQUFzQyxDQUFDLENBQUMsaUJBQWlCLENBQUM7QUFDNUYsdURBQWlEO0FBQ2pELGdEQUFnRDtBQUNoRCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUNqRCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUNsRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMscUNBQXFDLENBQUMsQ0FBQztBQUM5RCw2QkFBNkI7QUFDN0IsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7QUFDdEUsTUFBTSxrQkFBa0IsR0FBRyxPQUFPLENBQUMsaUNBQWlDLENBQUMsQ0FBQztBQUN0RSxxQ0FBcUM7QUFDckMsNENBQTRDO0FBRTVDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMvQixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0IsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDbEQsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFFdkMsY0FBYyxDQUFDLEVBQUMsR0FBRyxFQUFD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