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
const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");
const chromeFinder = require("./chrome-finder");
const ask_1 = require("./ask");
const mkdirp = require('mkdirp');
const net = require("net");
const rimraf = require('rimraf');
const log = require('../lighthouse-core/lib/log');
const spawn = childProcess.spawn;
const execSync = childProcess.execSync;
const isWindows = process.platform === 'win32';
class ChromeLauncher {
    // We can not use default args here due to support node pre 6.
    constructor(opts) {
        this.prepared = false;
        this.pollInterval = 500;
        opts = opts || {};
        // choose the first one (default)
        this.autoSelectChrome = defaults(opts.autoSelectChrome, true);
        this.startingUrl = defaults(opts.startingUrl, 'about:blank');
        this.additionalFlags = defaults(opts.additionalFlags, []);
        this.port = defaults(opts.port, 9222);
    }
    flags() {
        const flags = [
            `--remote-debugging-port=${this.port}`,
            // Disable built-in Google Translate service
            '--disable-translate',
            // Disable all chrome extensions entirely
            '--disable-extensions',
            // Disable various background network services, including extension updating,
            //   safe browsing service, upgrade detector, translate, UMA
            '--disable-background-networking',
            // Disable fetching safebrowsing lists, likely redundant due to disable-background-networking
            '--safebrowsing-disable-auto-update',
            // Disable syncing to a Google account
            '--disable-sync',
            // Disable reporting to UMA, but allows for collection
            '--metrics-recording-only',
            // Disable installation of default apps on first run
            '--disable-default-apps',
            // Skip first run wizards
            '--no-first-run',
            // Place Chrome profile in a custom location we'll rm -rf later
            `--user-data-dir=${this.TMP_PROFILE_DIR}`
        ];
        if (process.platform === 'linux') {
            flags.push('--disable-setuid-sandbox');
        }
        flags.push(...this.additionalFlags);
        flags.push(this.startingUrl);
        return flags;
    }
    prepare() {
        switch (process.platform) {
            case 'darwin':
            case 'linux':
                this.TMP_PROFILE_DIR = unixTmpDir();
                break;
            case 'win32':
                this.TMP_PROFILE_DIR = win32TmpDir();
                break;
            default:
                throw new Error('Platform ' + process.platform + ' is not supported');
        }
        this.outFile = fs.openSync(`${this.TMP_PROFILE_DIR}/chrome-out.log`, 'a');
        this.errFile = fs.openSync(`${this.TMP_PROFILE_DIR}/chrome-err.log`, 'a');
        // fix for Node4
        // you can't pass a fd to fs.writeFileSync
        this.pidFile = `${this.TMP_PROFILE_DIR}/chrome.pid`;
        log.verbose('ChromeLauncher', `created ${this.TMP_PROFILE_DIR}`);
        this.prepared = true;
    }
    run() {
        if (!this.prepared) {
            this.prepare();
        }
        return Promise.resolve()
            .then(() => {
            const installations = chromeFinder[process.platform]();
            if (installations.length < 1) {
                return Promise.reject(new Error('No Chrome Installations Found'));
            }
            else if (installations.length === 1 || this.autoSelectChrome) {
                return installations[0];
            }
            return ask_1.ask('Choose a Chrome installation to use with Lighthouse', installations);
        })
            .then(execPath => this.spawn(execPath));
    }
    spawn(execPath) {
        return new Promise(resolve => {
            if (this.chrome) {
                log.log('ChromeLauncher', `Chrome already running with pid ${this.chrome.pid}.`);
                return resolve(this.chrome.pid);
            }
            const chrome = spawn(execPath, this.flags(), {
                detached: true,
                stdio: ['ignore', this.outFile, this.errFile]
            });
            this.chrome = chrome;
            fs.writeFileSync(this.pidFile, chrome.pid.toString());
            log.verbose('ChromeLauncher', `Chrome running with pid ${chrome.pid} on port ${this.port}.`);
            resolve(chrome.pid);
        })
            .then(pid => Promise.all([pid, this.waitUntilReady()]));
    }
    cleanup(client) {
        if (client) {
            client.removeAllListeners();
            client.end();
            client.destroy();
            client.unref();
        }
    }
    // resolves if ready, rejects otherwise
    isDebuggerReady() {
        return new Promise((resolve, reject) => {
            const client = net.createConnection(this.port);
            client.once('error', err => {
                this.cleanup(client);
                reject(err);
            });
            client.once('connect', () => {
                this.cleanup(client);
                resolve();
            });
        });
    }
    // resolves when debugger is ready, rejects after 10 polls
    waitUntilReady() {
        const launcher = this;
        return new Promise((resolve, reject) => {
            let retries = 0;
            let waitStatus = 'Waiting for browser.';
            (function poll() {
                if (retries === 0) {
                    log.log('ChromeLauncher', waitStatus);
                }
                retries++;
                waitStatus += '..';
                log.log('ChromeLauncher', waitStatus);
                launcher
                    .isDebuggerReady()
                    .then(() => {
                    log.log('ChromeLauncher', waitStatus + `${log.greenify(log.tick)}`);
                    resolve();
                })
                    .catch(err => {
                    if (retries > 10) {
                        return reject(err);
                    }
                    delay(launcher.pollInterval).then(poll);
                });
            })();
        });
    }
    kill() {
        return new Promise(resolve => {
            if (this.chrome) {
                this.chrome.on('close', () => {
                    this.destroyTmp()
                        .then(resolve);
                });
                log.log('ChromeLauncher', 'Killing all Chrome Instances');
                try {
                    if (isWindows) {
                        execSync(`taskkill /pid ${this.chrome.pid} /T /F`);
                    }
                    else {
                        process.kill(-this.chrome.pid);
                    }
                }
                catch (err) {
                    log.warn('ChromeLauncher', `Chrome could not be killed ${err.message}`);
                }
                delete this.chrome;
            }
            else {
                // fail silently as we did not start chrome
                resolve();
            }
        });
    }
    destroyTmp() {
        return new Promise(resolve => {
            if (!this.TMP_PROFILE_DIR) {
                return resolve();
            }
            log.verbose('ChromeLauncher', `Removing ${this.TMP_PROFILE_DIR}`);
            if (this.outFile) {
                fs.closeSync(this.outFile);
                delete this.outFile;
            }
            if (this.errFile) {
                fs.closeSync(this.errFile);
                delete this.errFile;
            }
            rimraf(this.TMP_PROFILE_DIR, () => resolve());
        });
    }
}
exports.ChromeLauncher = ChromeLauncher;
;
function defaults(val, def) {
    return typeof val === 'undefined' ? def : val;
}
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}
function unixTmpDir() {
    return execSync('mktemp -d -t lighthouse.XXXXXXX').toString().trim();
}
function win32TmpDir() {
    const winTmpPath = process.env.TEMP ||
        process.env.TMP ||
        (process.env.SystemRoot || process.env.windir) + '\\temp';
    const randomNumber = Math.floor(Math.random() * 9e7 + 1e7);
    const tmpdir = path.join(winTmpPath, 'lighthouse.' + randomNumber);
    mkdirp.sync(tmpdir);
    return tmpdir;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hyb21lLWxhdW5jaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2hyb21lLWxhdW5jaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7R0FlRztBQUVILFlBQVksQ0FBQztBQUViLDhDQUE4QztBQUM5Qyx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLGdEQUFnRDtBQUNoRCwrQkFBMEI7QUFFMUIsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pDLDJCQUEyQjtBQUMzQixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakMsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLDRCQUE0QixDQUFDLENBQUM7QUFDbEQsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQztBQUNqQyxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDO0FBQ3ZDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDO0FBRS9DO0lBYUUsOERBQThEO0lBQzlELFlBQVksSUFJTTtRQWpCbEIsYUFBUSxHQUFZLEtBQUssQ0FBQTtRQUN6QixpQkFBWSxHQUFXLEdBQUcsQ0FBQTtRQWtCcEIsSUFBSSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7UUFFbEIsaUNBQWlDO1FBQ2pDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzlELElBQUksQ0FBQyxXQUFXLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLGVBQWUsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMxRCxJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENB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