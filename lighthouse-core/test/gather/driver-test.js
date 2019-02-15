/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Driver = require('../../gather/driver.js');
const Connection = require('../../gather/connections/connection.js');
const Element = require('../../lib/element.js');
const EventEmitter = require('events').EventEmitter;
const {protocolGetVersionResponse} = require('./fake-driver');

const redirectDevtoolsLog = require('../fixtures/wikipedia-redirect.devtoolslog.json');

/* eslint-env jest */

jest.useFakeTimers();

/**
 * Creates a jest mock function whose implementation consumes mocked protocol responses matching the
 * requested command in the order they were mocked.
 *
 * It is decorated with two methods:
 *    - `mockResponse` which pushes protocol message responses for consumption
 *    - `findInvocation` which asserts that `sendCommand` was invoked with the given command and
 *      returns the protocol message argument.
 */
function createMockSendCommandFn() {
  const mockResponses = [];
  const mockFn = jest.fn().mockImplementation(command => {
    const indexOfResponse = mockResponses.findIndex(entry => entry.command === command);
    if (indexOfResponse === -1) throw new Error(`${command} unimplemented`);
    const {response} = mockResponses[indexOfResponse];
    mockResponses.splice(indexOfResponse, 1);
    return Promise.resolve(response);
  });

  mockFn.mockResponse = (command, response) => {
    mockResponses.push({command, response});
    return mockFn;
  };

  mockFn.findInvocation = command => {
    expect(mockFn).toHaveBeenCalledWith(command, expect.anything());
    return mockFn.mock.calls.find(call => call[0] === command)[1];
  };

  return mockFn;
}

/**
 * In some functions we have lots of promise follow ups that get queued by protocol messages.
 * This is a convenience method to easily advance all timers and flush all the queued microtasks.
 */
async function flushAllTimersAndMicrotasks() {
  for (let i = 0; i < 1000; i++) {
    jest.advanceTimersByTime(1);
    await Promise.resolve();
  }
}

function createOnceStub(events) {
  return (eventName, cb) => {
    if (events[eventName]) {
      // wait a tick b/c real events never fire immediately
      setTimeout(_ => cb(events[eventName]), 0);
      return;
    }

    throw Error(`Stub not implemented: ${eventName}`);
  };
}

let driver;
let connectionStub;

beforeEach(() => {
  connectionStub = new Connection();
  connectionStub.sendCommand = cmd => {
    throw new Error(`${cmd} not implemented`);
  };
  driver = new Driver(connectionStub);
});

describe('.querySelector(All)', () => {
  it('returns null when DOM.querySelector finds no node', async () => {
    connectionStub.sendCommand = createMockSendCommandFn()
      .mockResponse('DOM.getDocument', {root: {nodeId: 249}})
      .mockResponse('DOM.querySelector', {nodeId: 0});

    const result = await driver.querySelector('invalid');
    expect(result).toEqual(null);
  });

  it('returns element instance when DOM.querySelector finds a node', async () => {
    connectionStub.sendCommand = createMockSendCommandFn()
    .mockResponse('DOM.getDocument', {root: {nodeId: 249}})
      .mockResponse('DOM.querySelector', {nodeId: 231});

    const result = await driver.querySelector('meta head');
    expect(result).toBeInstanceOf(Element);
  });

  it('returns [] when DOM.querySelectorAll finds no node', async () => {
    connectionStub.sendCommand = createMockSendCommandFn()
    .mockResponse('DOM.getDocument', {root: {nodeId: 249}})
      .mockResponse('DOM.querySelectorAll', {nodeIds: []});

    const result = await driver.querySelectorAll('#no.matches');
    expect(result).toEqual([]);
  });

  it('returns element when DOM.querySelectorAll finds node', async () => {
    connectionStub.sendCommand = createMockSendCommandFn()
    .mockResponse('DOM.getDocument', {root: {nodeId: 249}})
      .mockResponse('DOM.querySelectorAll', {nodeIds: [231]});

    const result = await driver.querySelectorAll('#no.matches');
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Element);
  });
});

describe('.getObjectProperty', () => {
  it('returns value when getObjectProperty finds property name', async () => {
    const property = {
      name: 'testProp',
      value: {
        value: 123,
      },
    };

    connectionStub.sendCommand = createMockSendCommandFn()
      .mockResponse('Runtime.getProperties', {result: [property]});

    const result = await driver.getObjectProperty('objectId', 'testProp');
    expect(result).toEqual(123);
  });

  it('returns null when getObjectProperty finds no property name', async () => {
    connectionStub.sendCommand = createMockSendCommandFn()
      .mockResponse('Runtime.getProperties', {result: []});

    const result = await driver.getObjectProperty('objectId', 'testProp');
    expect(result).toEqual(null);
  });

  it('returns null when getObjectProperty finds property name with no value', async () => {
    connectionStub.sendCommand = createMockSendCommandFn()
      .mockResponse('Runtime.getProperties', {result: [{name: 'testProp'}]});

    const result = await driver.getObjectProperty('objectId', 'testProp');
    expect(result).toEqual(null);
  });
});

describe('.getRequestContent', () => {
  it('throws if getRequestContent takes too long', async () => {
    connectionStub.sendCommand = jest.fn()
      .mockImplementationOnce(() => new Promise(r => setTimeout(r), 5000));

    // Fail if we don't reach our two assertions in the catch block
    expect.assertions(2);

    try {
      const responsePromise = driver.getRequestContent('', 1000);
      jest.advanceTimersByTime(1001);

      await responsePromise;
    } catch (err) {
      expect(err.code).toEqual('PROTOCOL_TIMEOUT');
      expect(err.friendlyMessage).toBeDisplayString(
        /^Waiting for DevTools.*Method: Network.getResponseBody/
      );
    }
  });
});

describe('.evaluateAsync', () => {
  it('evaluates an expression', async () => {
    connectionStub.sendCommand = createMockSendCommandFn()
      .mockResponse('Runtime.evaluate', {result: {value: 2}});

    const value = await driver.evaluateAsync('1 + 1');
    expect(value).toEqual(2);
    connectionStub.sendCommand.findInvocation('Runtime.evaluate');
  });

  it('evaluates an expression in isolation', async () => {
    connectionStub.sendCommand = createMockSendCommandFn()
      .mockResponse('Page.getResourceTree', {frameTree: {frame: {id: 1337}}})
      .mockResponse('Page.createIsolatedWorld', {executionContextId: 1})
      .mockResponse('Runtime.evaluate', {result: {value: 2}});

    const value = await driver.evaluateAsync('1 + 1', {useIsolation: true});
    expect(value).toEqual(2);

    // Check that we used the correct frame when creating the isolated context
    const createWorldArgs = connectionStub.sendCommand.findInvocation('Page.createIsolatedWorld');
    expect(createWorldArgs).toMatchObject({frameId: 1337});

    // Check that we used the isolated context when evaluating
    const evaluateArgs = connectionStub.sendCommand.findInvocation('Runtime.evaluate');
    expect(evaluateArgs).toMatchObject({contextId: 1});

    // Make sure we cached the isolated context from last time
    connectionStub.sendCommand = createMockSendCommandFn().mockResponse(
      'Runtime.evaluate',
      {result: {value: 2}}
    );
    await driver.evaluateAsync('1 + 1', {useIsolation: true});
    expect(connectionStub.sendCommand).not.toHaveBeenCalledWith(
      'Page.createIsolatedWorld',
      expect.anything()
    );
  });
});

describe('.sendCommand', () => {
  it('.sendCommand timesout when commands take too long', async () => {
    connectionStub.sendCommand = jest.fn()
      .mockImplementationOnce(() => new Promise(r => setTimeout(r), 5000));

    driver.setNextProtocolTimeout(10000);
    const pageEnablePromise = driver.sendCommand('Page.enable');
    jest.advanceTimersByTime(5001);
    await pageEnablePromise;

    driver.setNextProtocolTimeout(5);
    const pageDisablePromise = driver.sendCommand('Page.disable');
    jest.advanceTimersByTime(10);

    await expect(pageDisablePromise).rejects.toMatchObject({
      code: 'PROTOCOL_TIMEOUT',
    });
  });
});

describe('.beginTrace', () => {
  beforeEach(() => {
    connectionStub.sendCommand = createMockSendCommandFn()
      .mockResponse('Browser.getVersion', protocolGetVersionResponse)
      .mockResponse('Page.enable', {})
      .mockResponse('Tracing.start', {});
  });

  it('will request default traceCategories', async () => {
    await driver.beginTrace();

    const tracingStartArgs = connectionStub.sendCommand.findInvocation('Tracing.start');
    expect(tracingStartArgs.categories).toContain('devtools.timeline');
    expect(tracingStartArgs.categories).not.toContain('toplevel');
    expect(tracingStartArgs.categories).toContain('disabled-by-default-lighthouse');
  });

  it('will use requested additionalTraceCategories', async () => {
    await driver.beginTrace({additionalTraceCategories: 'loading,xtra_cat'});

    const tracingStartArgs = connectionStub.sendCommand.findInvocation('Tracing.start');
    expect(tracingStartArgs.categories).toContain('blink.user_timing');
    expect(tracingStartArgs.categories).toContain('xtra_cat');
    // Make sure it deduplicates categories too
    expect(tracingStartArgs.categories).not.toMatch(/loading.*loading/);
  });

  it('will adjust traceCategories based on chrome version', async () => {
    connectionStub.sendCommand = createMockSendCommandFn()
      .mockResponse('Browser.getVersion', {product: 'Chrome/70.0.3577.0'})
      .mockResponse('Page.enable', {})
      .mockResponse('Tracing.start', {});

    await driver.beginTrace();

    const tracingStartArgs = connectionStub.sendCommand.findInvocation('Tracing.start');
    // m70 doesn't have disabled-by-default-lighthouse, so 'toplevel' is used instead.
    expect(tracingStartArgs.categories).toContain('toplevel');
    expect(tracingStartArgs.categories).not.toContain('disabled-by-default-lighthouse');
  });
});

describe('.setExtraHTTPHeaders', () => {
  it('should Network.setExtraHTTPHeaders when there are extra-headers', async () => {
    connectionStub.sendCommand = createMockSendCommandFn().mockResponse(
      'Network.setExtraHTTPHeaders',
      {}
    );

    await driver.setExtraHTTPHeaders({
      'Cookie': 'monster',
      'x-men': 'wolverine',
    });

    expect(connectionStub.sendCommand).toHaveBeenCalledWith(
      'Network.setExtraHTTPHeaders',
      expect.anything()
    );
  });

  it('should Network.setExtraHTTPHeaders when there are extra-headers', async () => {
    connectionStub.sendCommand = createMockSendCommandFn();
    await driver.setExtraHTTPHeaders();

    expect(connectionStub.sendCommand).not.toHaveBeenCalled();
  });
});

describe('.getAppManifest', () => {
  it('should return null when no manifest', async () => {
    connectionStub.sendCommand = createMockSendCommandFn().mockResponse(
      'Page.getAppManifest',
      {data: undefined, url: '/manifest'}
    );
    const result = await driver.getAppManifest();
    expect(result).toEqual(null);
  });

  it('should return the manifest', async () => {
    const manifest = {name: 'The App'};
    connectionStub.sendCommand = createMockSendCommandFn().mockResponse(
      'Page.getAppManifest',
      {data: JSON.stringify(manifest), url: '/manifest'}
    );
    const result = await driver.getAppManifest();
    expect(result).toEqual({data: JSON.stringify(manifest), url: '/manifest'});
  });

  it('should handle BOM-encoded manifest', async () => {
    const fs = require('fs');
    const manifestWithoutBOM = fs.readFileSync(__dirname + '/../fixtures/manifest.json').toString();
    const manifestWithBOM = fs
      .readFileSync(__dirname + '/../fixtures/manifest-bom.json')
      .toString();

    connectionStub.sendCommand = createMockSendCommandFn().mockResponse(
      'Page.getAppManifest',
      {data: manifestWithBOM, url: '/manifest'}
    );
    const result = await driver.getAppManifest();
    expect(result).toEqual({data: manifestWithoutBOM, url: '/manifest'});
  });
});

describe('.goOffline', () => {
  it('should send offline emulation', async () => {
    connectionStub.sendCommand = createMockSendCommandFn()
      .mockResponse('Network.enable', {})
      .mockResponse('Network.emulateNetworkConditions', {});

    await driver.goOffline();
    const emulateArgs = connectionStub.sendCommand
      .findInvocation('Network.emulateNetworkConditions');
    expect(emulateArgs).toEqual({
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });
  });
});

describe('.gotoURL', () => {
  beforeEach(() => {
    connectionStub.sendCommand = createMockSendCommandFn()
      .mockResponse('Network.enable', {})
      .mockResponse('Page.enable', {})
      .mockResponse('Page.setLifecycleEventsEnabled', {})
      .mockResponse('Emulation.setScriptExecutionDisabled', {})
      .mockResponse('Page.navigate', {})
      .mockResponse('Runtime.evaluate', {});
  });

  it('will track redirects through gotoURL load', async () => {
    const delay = _ => new Promise(resolve => setTimeout(resolve));

    class ReplayConnection extends EventEmitter {
      connect() {
        return Promise.resolve();
      }
      disconnect() {
        return Promise.resolve();
      }
      replayLog() {
        redirectDevtoolsLog.forEach(msg => this.emit('protocolevent', msg));
      }
      sendCommand(method) {
        const resolve = Promise.resolve();

        // If navigating, wait, then replay devtools log in parallel to resolve.
        if (method === 'Page.navigate') {
          resolve.then(delay).then(_ => this.replayLog());
        }

        return resolve;
      }
    }
    const replayConnection = new ReplayConnection();
    const driver = new Driver(replayConnection);

    // Redirect in log will go through
    const startUrl = 'http://en.wikipedia.org/';
    // then https://en.wikipedia.org/
    // then https://en.wikipedia.org/wiki/Main_Page
    const finalUrl = 'https://en.m.wikipedia.org/wiki/Main_Page';

    const loadOptions = {
      waitForLoad: true,
      passContext: {
        passConfig: {
          pauseAfterLoadMs: 0,
          networkQuietThresholdMs: 0,
          cpuQuietThresholdMs: 0,
        },
      },
    };

    const loadPromise = driver.gotoURL(startUrl, loadOptions);

    await flushAllTimersAndMicrotasks();
    const loadedUrl = await loadPromise;
    expect(loadedUrl).toEqual(finalUrl);
  });

  describe('when waitForNavigated', () => {});

  describe('when waitForLoad', () => {
    it('does not reject when page is secure', async () => {
      const secureSecurityState = {
        explanations: [],
        securityState: 'secure',
      };
      driver.on = driver.once = createOnceStub({
        'Security.securityStateChanged': secureSecurityState,
        'Page.loadEventFired': {},
        'Page.domContentEventFired': {},
      });

      const startUrl = 'https://www.example.com';
      const loadOptions = {
        waitForLoad: true,
        passContext: {
          passConfig: {
            networkQuietThresholdMs: 1,
          },
          settings: {
            maxWaitForLoad: 1,
          },
        },
      };

      const loadPromise = driver.gotoURL(startUrl, loadOptions);
      await flushAllTimersAndMicrotasks();
      await loadPromise;
    });

    it('rejects when page is insecure', async () => {
      const insecureSecurityState = {
        explanations: [
          {
            description: 'reason 1.',
            securityState: 'insecure',
          },
          {
            description: 'blah.',
            securityState: 'info',
          },
          {
            description: 'reason 2.',
            securityState: 'insecure',
          },
        ],
        securityState: 'insecure',
      };
      driver.on = createOnceStub({
        'Security.securityStateChanged': insecureSecurityState,
      });

      const startUrl = 'https://www.example.com';
      const loadOptions = {
        waitForLoad: true,
        passContext: {
          passConfig: {
            networkQuietThresholdMs: 1,
          },
        },
      };

      expect.assertions(2);

      try {
        const loadPromise = driver.gotoURL(startUrl, loadOptions);
        await flushAllTimersAndMicrotasks();
        await loadPromise;
      } catch (err) {
        expect(err.code).toEqual('INSECURE_DOCUMENT_REQUEST');
        expect(err.friendlyMessage).toBeDisplayString(
          'The URL you have provided does not have valid security credentials. reason 1. reason 2.'
        );
      }
    });
  });
});

describe('.assertNoSameOriginServiceWorkerClients', () => {
  beforeEach(() => {
    connectionStub.sendCommand = createMockSendCommandFn()
      .mockResponse('ServiceWorker.enable', {})
      .mockResponse('ServiceWorker.disable', {})
      .mockResponse('ServiceWorker.enable', {})
      .mockResponse('ServiceWorker.disable', {});
  });

  function createSWRegistration(id, url, isDeleted) {
    return {
      isDeleted: !!isDeleted,
      registrationId: id,
      scopeURL: url,
    };
  }

  function createActiveWorker(id, url, controlledClients, status = 'activated') {
    return {
      registrationId: id,
      scriptURL: url,
      controlledClients,
      status,
    };
  }

  it('will pass if there are no current service workers', async () => {
    const pageUrl = 'https://example.com/';
    driver.once = createOnceStub({
      'ServiceWorker.workerRegistrationUpdated': {
        registrations: [],
      },
    });

    driver.on = createOnceStub({
      'ServiceWorker.workerVersionUpdated': {
        versions: [],
      },
    });


    const assertPromise = driver.assertNoSameOriginServiceWorkerClients(pageUrl);
    await flushAllTimersAndMicrotasks();
    await assertPromise;
  });

  it('will pass if there is an active service worker for a different origin', async () => {
    const pageUrl = 'https://example.com/';
    const secondUrl = 'https://example.edu';
    const swUrl = `${secondUrl}sw.js`;

    const registrations = [createSWRegistration(1, secondUrl)];
    const versions = [createActiveWorker(1, swUrl, ['uniqueId'])];

    driver.once = createOnceStub({
      'ServiceWorker.workerRegistrationUpdated': {
        registrations,
      },
    });

    driver.on = createOnceStub({
      'ServiceWorker.workerVersionUpdated': {
        versions,
      },
    });

    const assertPromise = driver.assertNoSameOriginServiceWorkerClients(pageUrl);
    await flushAllTimersAndMicrotasks();
    await assertPromise;
  });

  it('will fail if a service worker with a matching origin has a controlled client', async () => {
    const pageUrl = 'https://example.com/';
    const swUrl = `${pageUrl}sw.js`;
    const registrations = [createSWRegistration(1, pageUrl)];
    const versions = [createActiveWorker(1, swUrl, ['uniqueId'])];

    driver.once = createOnceStub({
      'ServiceWorker.workerRegistrationUpdated': {
        registrations,
      },
    });

    driver.on = createOnceStub({
      'ServiceWorker.workerVersionUpdated': {
        versions,
      },
    });

    expect.assertions(1);

    try {
      const assertPromise = driver.assertNoSameOriginServiceWorkerClients(pageUrl);
      await flushAllTimersAndMicrotasks();
      await assertPromise;
    } catch (err) {
      expect(err.message.toLowerCase()).toContain('multiple tabs');
    }
  });

  it('will succeed if a service worker with has no controlled clients', async () => {
    const pageUrl = 'https://example.com/';
    const swUrl = `${pageUrl}sw.js`;
    const registrations = [createSWRegistration(1, pageUrl)];
    const versions = [createActiveWorker(1, swUrl, [])];

    driver.once = createOnceStub({
      'ServiceWorker.workerRegistrationUpdated': {
        registrations,
      },
    });

    driver.on = createOnceStub({
      'ServiceWorker.workerVersionUpdated': {
        versions,
      },
    });

    const assertPromise = driver.assertNoSameOriginServiceWorkerClients(pageUrl);
    await flushAllTimersAndMicrotasks();
    await assertPromise;
  });

  it('will wait for serviceworker to be activated', async () => {
    const pageUrl = 'https://example.com/';
    const swUrl = `${pageUrl}sw.js`;
    const registrations = [createSWRegistration(1, pageUrl)];
    const versions = [createActiveWorker(1, swUrl, [], 'installing')];

    driver.once = createOnceStub({
      'ServiceWorker.workerRegistrationUpdated': {
        registrations,
      },
    });

    driver.on = (eventName, cb) => {
      if (eventName === 'ServiceWorker.workerVersionUpdated') {
        cb({versions});

        setTimeout(() => {
          cb({
            versions: [createActiveWorker(1, swUrl, [], 'activated')],
          });
        }, 50);

        return;
      }

      throw Error(`Stub not implemented: ${eventName}`);
    };

    const assertPromise = driver.assertNoSameOriginServiceWorkerClients(pageUrl);
    await flushAllTimersAndMicrotasks();
    await assertPromise;
  });
});

describe('.goOnline', () => {
  beforeEach(() => {
    connectionStub.sendCommand = createMockSendCommandFn()
      .mockResponse('Network.enable', {})
      .mockResponse('Emulation.setCPUThrottlingRate', {})
      .mockResponse('Network.emulateNetworkConditions', {});
  });

  it('re-establishes previous throttling settings', async () => {
    await driver.goOnline({
      passConfig: {useThrottling: true},
      settings: {
        throttlingMethod: 'devtools',
        throttling: {
          requestLatencyMs: 500,
          downloadThroughputKbps: 1000,
          uploadThroughputKbps: 1000,
        },
      },
    });

    const emulateArgs = connectionStub.sendCommand
      .findInvocation('Network.emulateNetworkConditions');
    expect(emulateArgs).toEqual({
      offline: false,
      latency: 500,
      downloadThroughput: (1000 * 1024) / 8,
      uploadThroughput: (1000 * 1024) / 8,
    });
  });

  it('clears network emulation when throttling is not devtools', async () => {
    await driver.goOnline({
      passConfig: {useThrottling: true},
      settings: {
        throttlingMethod: 'provided',
      },
    });

    const emulateArgs = connectionStub.sendCommand
      .findInvocation('Network.emulateNetworkConditions');
    expect(emulateArgs).toEqual({
      offline: false,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });
  });

  it('clears network emulation when useThrottling is false', async () => {
    await driver.goOnline({
      passConfig: {useThrottling: false},
      settings: {
        throttlingMethod: 'devtools',
        throttling: {
          requestLatencyMs: 500,
          downloadThroughputKbps: 1000,
          uploadThroughputKbps: 1000,
        },
      },
    });

    const emulateArgs = connectionStub.sendCommand
      .findInvocation('Network.emulateNetworkConditions');
    expect(emulateArgs).toEqual({
      offline: false,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });
  });
});
