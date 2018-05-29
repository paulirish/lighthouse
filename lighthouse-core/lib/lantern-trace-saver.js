/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * @param {LH.Gatherer.Simulation.Result['nodeTimings']} nodeTimings
 * @return {LH.Trace}
 */
function convertNodeTimingsToTrace(nodeTimings) {
  /** @type {LH.TraceEvent[]} */
  const traceEvents = [];
  const baseTs = 1e9;
  const baseEvent = {pid: 1, tid: 1, cat: 'devtools.timeline'};
  const frame = 'A00001';
  /** @param {number} ms */
  const toMicroseconds = ms => baseTs + ms * 1000;

  traceEvents.push(createFakeTracingStartedEvent());
  traceEvents.push({...createFakeTracingStartedEvent(), name: 'TracingStartedInBrowser'});

  // Create a fake requestId counter
  let requestId = 1;
  let lastEventEndTime = 0;
  for (const [node, timing] of nodeTimings.entries()) {
    lastEventEndTime = Math.max(lastEventEndTime, timing.endTime);
    if (node.type === 'cpu') {
      // Represent all CPU work that was bundled in a task as an EvaluateScript event
      const cpuNode = /** @type {LH.Gatherer.Simulation.GraphCPUNode} */ (node);
      traceEvents.push(createFakeEvaluateScriptEvent(cpuNode, timing));
    } else {
      const networkNode = /** @type {LH.Gatherer.Simulation.GraphNetworkNode} */ (node);
      // Ignore data URIs as they don't really add much value
      if (/^data/.test(networkNode.record.url)) continue;
      traceEvents.push(...createFakeNetworkEvents(networkNode.record, timing));
    }
  }

  // Create a fake evaluate script event ~1s after the trace ends for a sane default bounds in DT
  traceEvents.push(
    createFakeEvaluateScriptEvent(
      {childEvents: []},
      {
        startTime: lastEventEndTime + 1000,
        endTime: lastEventEndTime + 1001,
      }
    )
  );

  return {traceEvents};

  /**
   * @return {LH.TraceEvent}
   */
  function createFakeTracingStartedEvent() {
    const argsData = {
      frameTreeNodeId: 1,
      sessionId: '1.1',
      page: frame,
      persistentIds: true,
      frames: [{frame, url: 'about:blank', name: '', processId: 1}],
    };

    return {
      ...baseEvent,
      ts: baseTs - 1e5,
      ph: 'I',
      s: 't',
      cat: 'disabled-by-default-devtools.timeline',
      name: 'TracingStartedInPage',
      args: {data: argsData},
      dur: 0,
    };
  }

  /**
   * @param {{childEvents: LH.TraceEvent[]}} cpuNode
   * @param {{startTime: number, endTime: number}} timing
   * @return {LH.TraceEvent}
   */
  function createFakeEvaluateScriptEvent(cpuNode, timing) {
    const realEvaluateScriptEvent = cpuNode.childEvents.find(
      e => e.name === 'EvaluateScript' && !!e.args.data && !!e.args.data.url
    );
    // @ts-ignore
    const scriptUrl = realEvaluateScriptEvent && realEvaluateScriptEvent.args.data.url;
    const argsData = {
      url: scriptUrl || '',
      frame,
      lineNumber: 0,
      columnNumber: 0,
    };

    return {
      ...baseEvent,
      ph: 'X',
      name: 'EvaluateScript',
      ts: toMicroseconds(timing.startTime),
      dur: (timing.endTime - timing.startTime) * 1000,
      args: {data: argsData},
    };
  }

  /**
   * @param {LH.WebInspector.NetworkRequest} record
   * @param {LH.Gatherer.Simulation.NodeTiming} timing
   * @return {LH.TraceEvent[]}
   */
  function createFakeNetworkEvents(record, timing) {
    requestId++;

    // 0ms requests get super-messed up rendering
    // Use 20ms instead so they're still hoverable
    let {startTime, endTime} = timing; // eslint-disable-line prefer-const
    if (startTime === endTime) endTime += 20;

    const requestData = {requestId: requestId.toString(), frame};
    /** @type {Omit<LH.TraceEvent, 'name'|'ts'|'args'>} */
    const baseRequestEvent = {...baseEvent, ph: 'I', s: 't', dur: 0};

    const sendRequestData = {
      ...requestData,
      requestMethod: record.requestMethod,
      url: record.url,
      priority: record.priority(),
    };

    const receiveResponseData = {
      ...requestData,
      statusCode: record.statusCode,
      mimeType: record._mimeType,
      encodedDataLength: record._transferSize,
      fromCache: record._fromDiskCache,
      fromServiceWorker: record._fetchedViaServiceWorker,
    };

    const resourceFinishData = {
      ...requestData,
      decodedBodyLength: record._resourceSize,
      didFail: !!record.failed,
      finishTime: endTime,
    };

    /** @type {LH.TraceEvent[]} */
    const events = [
      {
        ...baseRequestEvent,
        name: 'ResourceSendRequest',
        ts: toMicroseconds(startTime),
        args: {data: sendRequestData},
      },
      {
        ...baseRequestEvent,
        name: 'ResourceFinish',
        ts: toMicroseconds(endTime),
        args: {data: resourceFinishData},
      },
    ];

    if (!record.failed) {
      events.push({
        ...baseRequestEvent,
        name: 'ResourceReceiveResponse',
        ts: toMicroseconds((startTime + endTime) / 2),
        args: {data: receiveResponseData},
      });
    }

    return events;
  }
}

module.exports = {
  simulationNamesToIgnore: [
    'unlabeled',
    // These node timings should be nearly identical to the ones produced for Interactive
    'optimisticFirstCPUIdle',
    'optimisticFlexFirstCPUIdle',
    'pessimisticFirstCPUIdle',
    'optimisticSpeedIndex',
    'optimisticFlexSpeedIndex',
    'pessimisticSpeedIndex',
    'optimisticEstimatedInputLatency',
    'optimisticFlexEstimatedInputLatency',
    'pessimisticEstimatedInputLatency',
  ],
  convertNodeTimingsToTrace,
};
