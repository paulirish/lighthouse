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
const WebInspector = require('../lib/web-inspector');

class ServiceWorker extends Gather {

  setup(options) {
    const driver = options.driver;
    var mgr = this.mgr = WebInspector.ServiceWorkerManager.createWithFakeTarget();
    var dispatcher = mgr._dispatcher;

    driver.on('ServiceWorker.workerCreated', data =>
      dispatcher.workerCreated(data.workerId, data.url, data.versionId));

    driver.on('ServiceWorker.workerTerminated', data =>
      dispatcher.workerTerminated(data.workerId));

    driver.on('ServiceWorker.dispatchMessage', data =>
      dispatcher.dispatchMessage(data.workerId, data.message));

    driver.on('ServiceWorker.workerRegistrationUpdated', data =>
      dispatcher.workerRegistrationUpdated(data.registrations));

    driver.on('ServiceWorker.workerErrorReported', data =>
      dispatcher.workerRegistrationUpdated(data.errorMessage));

    driver.on('ServiceWorker.workerVersionUpdated', data =>
      dispatcher.workerVersionUpdated(data.versions));

    driver.sendCommand('ServiceWorker.enable');
  }

  reloadSetup(options) {
    const driver = options.driver;
    this.resolved = false;

    this.artifactsResolved = new Promise((res, _) => {
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
