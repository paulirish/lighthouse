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
const WebInspectorObj = require('../lib/web-inspector');
const target = WebInspectorObj.target;
const WebInspector = WebInspectorObj.WebInspector;

class ServiceWorker extends Gather {

  setup(options) {
    const driver = options.driver;
    this.mgr = target.serviceWorkerManager;

    driver.on('ServiceWorker.workerCreated', data =>
      this.mgr._workerCreated(data.workerId, data.url, data.versionId));

    driver.on('ServiceWorker.workerTerminated', data =>
      this.mgr._workerTerminated(data.workerId));

    driver.on('ServiceWorker.dispatchMessage', data =>
      this.mgr._dispatchMessage(data.workerId, data.message));

    driver.on('ServiceWorker.workerRegistrationUpdated', data =>
      this.mgr._workerRegistrationUpdated(data.registrations));

    driver.on('ServiceWorker.workerErrorReported', data =>
      this.mgr._workerRegistrationUpdated(data.errorMessage));

    driver.on('ServiceWorker.workerVersionUpdated', data =>
      this.mgr._workerVersionUpdated(data.versions));

    driver.sendCommand('ServiceWorker.enable');
  }

  reloadSetup(options) {
    const driver = options.driver;
    this.resolved = false;

    this.artifactsResolved = new Promise((res, _) => {
      debugger;
      driver.on('ServiceWorker.workerVersionUpdated', data => {
        if (!this.resolved) {
          const controlledClients =
              ServiceWorker.getActivatedServiceWorker(data.versions, options.url);

          this.artifact = {
            serviceWorkers: {
              versions: controlledClients ? [controlledClients] : []
            }
          };
          this.resolved = (typeof this.artifact.serviceWorkers.versions !== 'undefined');
          res();
        }
      });
    });
  }

  static getActivatedServiceWorker(versions, url) {
    return versions.find(v => v.status === 'activated' && v.scriptURL.startsWith(url));
  }

  beforeReloadPageLoad(options) {
    const driver = options.driver;


    return this.artifactsResolved;
  }
}

module.exports = ServiceWorker;
