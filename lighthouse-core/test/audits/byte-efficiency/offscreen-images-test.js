/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const UnusedImages =
    require('../../../audits/byte-efficiency/offscreen-images.js');
const assert = require('assert');
const createTestTrace = require('../../create-test-trace.js');
const networkRecordsToDevtoolsLog = require('../../network-records-to-devtools-log.js');

/* eslint-env jest */
function generateRecord({
  resourceSizeInKb,
  url = 'https://google.com/logo.png',
  startTime = 0,
  mimeType = 'image/png',
}) {
  return {
    url,
    mimeType,
    startTime, // DevTools timestamp which is in seconds
    resourceSize: resourceSizeInKb * 1024,
  };
}

function generateSize(width, height, prefix = 'displayed') {
  const size = {};
  size[`${prefix}Width`] = width;
  size[`${prefix}Height`] = height;
  return size;
}

function generateImage(size, coords, networkRecord, src = 'https://google.com/logo.png') {
  Object.assign(networkRecord || {}, {url: src});

  const x = coords[0];
  const y = coords[1];

  const clientRect = {
    top: y,
    bottom: y + size.displayedHeight,
    left: x,
    right: x + size.displayedWidth,
  };
  const image = {src, clientRect, ...networkRecord};
  Object.assign(image, size);
  return image;
}

describe('OffscreenImages audit', () => {
  let context;
  const DEFAULT_DIMENSIONS = {innerWidth: 1920, innerHeight: 1080};

  beforeEach(() => {
    context = {settings: {throttlingMethod: 'devtools'}, computedCache: new Map()};
  });

  it('handles images without network record', () => {
    const topLevelTasks = [{ts: 1900, duration: 100}];
    const artifacts = {
      ViewportDimensions: DEFAULT_DIMENSIONS,
      ImageElements: [
        generateImage(generateSize(100, 100), [0, 0]),
      ],
      traces: {defaultPass: createTestTrace({topLevelTasks})},
      devtoolsLogs: {},
    };

    return UnusedImages.audit_(artifacts, [], context).then(auditResult => {
      assert.equal(auditResult.items.length, 0);
    });
  });

  it('does not find used images', async () => {
    const urlB = 'https://google.com/logo2.png';
    const urlC = 'data:image/jpeg;base64,foobar';
    const recordA = generateRecord({resourceSizeInKb: 100});
    const recordB = generateRecord({url: urlB, resourceSizeInKb: 100});
    const recordC = generateRecord({url: urlC, resourceSizeInKb: 3});
    const topLevelTasks = [{ts: 1900, duration: 100}];
    const artifacts = {
      ViewportDimensions: DEFAULT_DIMENSIONS,
      ImageElements: [
        generateImage(generateSize(200, 200), [0, 0], recordA),
        generateImage(generateSize(100, 100), [0, 1080], recordB, urlB),
        generateImage(generateSize(400, 400), [1720, 1080], recordC, urlC),
      ],
      traces: {defaultPass: createTestTrace({topLevelTasks})},
      devtoolsLogs: {},
    };

    const auditResult = await UnusedImages.audit_(artifacts, [recordA, recordB, recordC], context);
    assert.equal(auditResult.items.length, 0);
  });

  it('finds unused images', async () => {
    const url = s => `https://google.com/logo${s}.png`;
    const topLevelTasks = [{ts: 1900, duration: 100}];
    const networkRecords = [
      generateRecord({url: url(''), resourceSizeInKb: 100}),
      generateRecord({url: url('B'), resourceSizeInKb: 100}),
      generateRecord({url: url('C'), resourceSizeInKb: 100}),
      generateRecord({url: url('D'), resourceSizeInKb: 100}),
      generateRecord({url: url('E'), resourceSizeInKb: 100}),
    ];
    const artifacts = {
      ViewportDimensions: DEFAULT_DIMENSIONS,
      ImageElements: [
        // offscreen to the right
        generateImage(generateSize(200, 200), [3000, 0], networkRecords[0]),
        // offscreen to the bottom
        generateImage(generateSize(100, 100), [0, 2000], networkRecords[1], url('B')),
        // offscreen to the top-left
        generateImage(generateSize(100, 100), [-2000, -1000], networkRecords[2], url('C')),
        // offscreen to the bottom-right
        generateImage(generateSize(100, 100), [3000, 2000], networkRecords[3], url('D')),
        // half offscreen to the top, should not warn
        generateImage(generateSize(1000, 1000), [0, -500], networkRecords[4], url('E')),
      ],
      traces: {defaultPass: createTestTrace({topLevelTasks})},
      devtoolsLogs: {},
    };

    const auditResult = await UnusedImages.audit_(artifacts, networkRecords, context);
    assert.equal(auditResult.items.length, 4);
  });

  it('finds images with 0 area', () => {
    const topLevelTasks = [{ts: 1900, duration: 100}];
    const networkRecord = generateRecord({resourceSizeInKb: 100});
    const artifacts = {
      ViewportDimensions: DEFAULT_DIMENSIONS,
      ImageElements: [
        generateImage(generateSize(0, 0), [0, 0], networkRecord),
      ],
      traces: {defaultPass: createTestTrace({topLevelTasks})},
      devtoolsLogs: {},
    };

    return UnusedImages.audit_(artifacts, [networkRecord], context).then(auditResult => {
      assert.equal(auditResult.items.length, 1);
      assert.equal(auditResult.items[0].wastedBytes, 100 * 1024);
    });
  });

  it('de-dupes images', () => {
    const urlB = 'https://google.com/logo2.png';
    const topLevelTasks = [{ts: 1900, duration: 100}];
    const networkRecords = [
      generateRecord({resourceSizeInKb: 50}),
      generateRecord({resourceSizeInKb: 50}),
      generateRecord({url: urlB, resourceSizeInKb: 200}),
      generateRecord({url: urlB, resourceSizeInKb: 90}),
    ];
    const artifacts = {
      ViewportDimensions: DEFAULT_DIMENSIONS,
      ImageElements: [
        generateImage(generateSize(50, 50), [0, 0], networkRecords[0]),
        generateImage(generateSize(1000, 1000), [1000, 1000], networkRecords[1]),
        generateImage(generateSize(50, 50), [0, 1500], networkRecords[2], urlB),
        generateImage(generateSize(400, 400), [0, 1500], networkRecords[3], urlB),
      ],
      traces: {defaultPass: createTestTrace({topLevelTasks})},
      devtoolsLogs: {},
    };

    return UnusedImages.audit_(artifacts, networkRecords, context).then(auditResult => {
      assert.equal(auditResult.items.length, 1);
    });
  });

  it('disregards images loaded after TTI', () => {
    const topLevelTasks = [{ts: 1900, duration: 100}];
    const networkRecord = generateRecord({resourceSizeInKb: 100, startTime: 3});
    const artifacts = {
      ViewportDimensions: DEFAULT_DIMENSIONS,
      ImageElements: [
        // offscreen to the right
        generateImage(generateSize(200, 200), [3000, 0], networkRecord),
      ],
      traces: {defaultPass: createTestTrace({topLevelTasks})},
      devtoolsLogs: {},
    };

    return UnusedImages.audit_(artifacts, [networkRecord], context).then(auditResult => {
      assert.equal(auditResult.items.length, 0);
    });
  });

  it('disregards images loaded after Trace End when interactive throws error', () => {
    const networkRecord = generateRecord({resourceSizeInKb: 100, startTime: 3});
    const artifacts = {
      ViewportDimensions: DEFAULT_DIMENSIONS,
      ImageElements: [
        // offscreen to the right
        generateImage(generateSize(200, 200), [3000, 0], networkRecord),
      ],
      traces: {defaultPass: createTestTrace({traceEnd: 2000})},
      devtoolsLogs: {},
    };

    return UnusedImages.audit_(artifacts, [networkRecord], context).then(auditResult => {
      assert.equal(auditResult.items.length, 0);
    });
  });

  it('finds images loaded before Trace End when TTI when interactive throws error', () => {
    const networkRecord = generateRecord({resourceSizeInKb: 100});
    const artifacts = {
      ViewportDimensions: DEFAULT_DIMENSIONS,
      ImageElements: [
        // offscreen to the right
        generateImage(generateSize(100, 100), [0, 2000], networkRecord),
      ],
      traces: {defaultPass: createTestTrace({traceEnd: 2000})},
      devtoolsLogs: {},
    };

    return UnusedImages.audit_(artifacts, [networkRecord], context).then(auditResult => {
      assert.equal(auditResult.items.length, 1);
    });
  });

  it('disregards images loaded after last long task (Lantern)', () => {
    context = {settings: {throttlingMethod: 'simulate'}, computedCache: new Map()};
    const wastedSize = 100 * 1024;
    const recordA = {
      url: 'https://example.com/a',
      resourceSize: wastedSize,
      requestId: 'a',
      startTime: 1,
      priority: 'High',
      timing: {receiveHeadersEnd: 1.25},
    };
    const recordB = {
      url: 'https://example.com/b',
      resourceSize: wastedSize,
      requestId: 'b',
      startTime: 2.25,
      priority: 'High',
      timing: {receiveHeadersEnd: 2.5},
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([recordA, recordB]);

    const topLevelTasks = [
      {ts: 1975, duration: 50},
    ];
    const artifacts = {
      ViewportDimensions: DEFAULT_DIMENSIONS,
      ImageElements: [
        generateImage(generateSize(0, 0), [0, 0], recordA, recordA.url),
        generateImage(generateSize(200, 200), [3000, 0], recordB, recordB.url),
      ],
      traces: {defaultPass: createTestTrace({topLevelTasks})},
      devtoolsLogs: {defaultPass: devtoolsLog},
    };

    return UnusedImages.audit_(artifacts, [recordA, recordB], context).then(auditResult => {
      assert.equal(auditResult.items.length, 1);
      assert.equal(auditResult.items[0].url, recordA.url);
      assert.equal(auditResult.items[0].wastedBytes, wastedSize);
    });
  });

  it('finds images loaded before last long task (Lantern)', () => {
    context = {settings: {throttlingMethod: 'simulate'}, computedCache: new Map()};
    const wastedSize = 100 * 1024;
    const recordA = {
      url: 'https://example.com/a',
      resourceSize: wastedSize,
      requestId: 'a',
      startTime: 1,
      priority: 'High',
      timing: {receiveHeadersEnd: 1.25},
    };
    const recordB = {
      url: 'https://example.com/b',
      resourceSize: wastedSize,
      requestId: 'b',
      startTime: 1.25,
      priority: 'High',
      timing: {receiveHeadersEnd: 1.5},
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([recordA, recordB]);

    // Enough tasks to spread out graph.
    const topLevelTasks = [
      {ts: 1000, duration: 10},
      {ts: 1050, duration: 10},
      {ts: 1975, duration: 50},
    ];
    const artifacts = {
      ViewportDimensions: DEFAULT_DIMENSIONS,
      ImageElements: [
        generateImage(generateSize(0, 0), [0, 0], recordA, recordA.url),
        generateImage(generateSize(200, 200), [3000, 0], recordB, recordB.url),
      ],
      traces: {defaultPass: createTestTrace({topLevelTasks})},
      devtoolsLogs: {defaultPass: devtoolsLog},
    };

    return UnusedImages.audit_(artifacts, [recordA, recordB], context).then(auditResult => {
      assert.equal(auditResult.items.length, 2);
      assert.equal(auditResult.items[0].url, recordA.url);
      assert.equal(auditResult.items[0].wastedBytes, wastedSize);
      assert.equal(auditResult.items[1].url, recordB.url);
      assert.equal(auditResult.items[1].wastedBytes, wastedSize);
    });
  });

  it('rethrow error when interactive throws error in Lantern', async () => {
    context = {settings: {throttlingMethod: 'simulate'}, computedCache: new Map()};
    const networkRecords = [
      generateRecord({url: 'a', resourceSizeInKb: 100, startTime: 3}),
      generateRecord({url: 'b', resourceSizeInKb: 100, startTime: 4}),
    ];
    const artifacts = {
      ViewportDimensions: DEFAULT_DIMENSIONS,
      ImageElements: [
        generateImage(generateSize(0, 0), [0, 0], networkRecords[0], 'a'),
        generateImage(generateSize(200, 200), [3000, 0], networkRecords[1], 'b'),
      ],
      traces: {defaultPass: createTestTrace({traceEnd: 2000})},
      devtoolsLogs: {},
    };

    try {
      await UnusedImages.audit_(artifacts, networkRecords, context);
    } catch (err) {
      assert.ok(err.message.includes('Did not provide necessary metric computation data'));
      return;
    }
    assert.ok(false);
  });
});
