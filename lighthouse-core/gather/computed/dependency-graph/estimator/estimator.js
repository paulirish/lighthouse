/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Node = require('../node');
const TcpConnection = require('./tcp-connection');
const emulation = require('../../../../lib/emulation').settings;

// see https://cs.chromium.org/search/?q=kDefaultMaxNumDelayableRequestsPerClient&sq=package:chromium&type=cs
const DEFAULT_MAXIMUM_CONCURRENT_REQUESTS = 10;
const DEFAULT_FALLBACK_TTFB = 30;
const DEFAULT_RTT = emulation.TYPICAL_MOBILE_THROTTLING_METRICS.targetLatency;
const DEFAULT_THROUGHPUT = emulation.TYPICAL_MOBILE_THROTTLING_METRICS.targetDownloadThroughput * 8;
const DEFAULT_CPU_MULTIPLIER = 5;

const TLS_SCHEMES = ['https', 'wss'];

function groupBy(items, keyFunc) {
  const grouped = new Map();
  items.forEach(item => {
    const key = keyFunc(item);
    const group = grouped.get(key) || [];
    group.push(item);
    grouped.set(key, group);
  });

  return grouped;
}

class Estimator {
  /**
   * @param {!Node} graph
   * @param {{rtt: number, throughput: number, fallbackTTFB: number,
   *    maximumConcurrentRequests: number}=} options
   */
  constructor(graph, options) {
    this._graph = graph;
    this._options = Object.assign(
      {
        rtt: DEFAULT_RTT,
        throughput: DEFAULT_THROUGHPUT,
        fallbackTTFB: DEFAULT_FALLBACK_TTFB,
        maximumConcurrentRequests: DEFAULT_MAXIMUM_CONCURRENT_REQUESTS,
        cpuMultiplier: DEFAULT_CPU_MULTIPLIER,
      },
      options
    );

    this._rtt = this._options.rtt;
    this._throughput = this._options.throughput;
    this._fallbackTTFB = this._options.fallbackTTFB;
    this._maximumConcurrentRequests = Math.min(
      TcpConnection.maximumSaturatedConnections(this._rtt, this._throughput),
      this._options.maximumConcurrentRequests
    );
    this._cpuMultiplier = this._options.cpuMultiplier;
  }

  /**
   * Computes the time to first byte of a network record. Returns Infinity if not available.
   * @param {!WebInspector.NetworkRequest} record
   * @return {number}
   */
  static getTTFB(record) {
    const timing = record._timing;
    return (timing && timing.receiveHeadersEnd - timing.sendEnd) || Infinity;
  }

  /**
   * Initializes this._networkRecords with the array of network records from the graph.
   */
  _initializeNetworkRecords() {
    this._networkRecords = [];

    this._graph.getRootNode().traverse(node => {
      if (node.type === Node.TYPES.NETWORK) {
        this._networkRecords.push(node.record);
      }
    });
  }

  /**
   * Initializes this._connections with the map of available TcpConnections by connectionId.
   */
  _initializeNetworkConnections() {
    const connections = new Map();
    const recordsByConnection = groupBy(this._networkRecords, record => record.connectionId);

    for (const [connectionId, records] of recordsByConnection.entries()) {
      const isTLS = TLS_SCHEMES.includes(records[0].parsedURL.scheme);

      // We'll approximate how much time the server for a connection took to respond after receiving
      // the request by computing the minimum TTFB time for requests on that connection.
      //    TTFB = one way latency + server response time + one way latency
      // Even though TTFB is greater than server response time, the RTT is underaccounted for by
      // not varying per-server and so the difference roughly evens out.
      // TODO(patrickhulce): investigate a way to identify per-server RTT
      let estimatedResponseTime = Math.min(...records.map(Estimator.getTTFB));

      // If we couldn't find a TTFB for the requests, use the fallback TTFB instead.
      if (!Number.isFinite(estimatedResponseTime)) {
        estimatedResponseTime = this._fallbackTTFB;
      }

      const connection = new TcpConnection(
        this._rtt,
        this._throughput,
        estimatedResponseTime,
        isTLS
      );

      connections.set(connectionId, connection);
    }

    this._connections = connections;
    return connections;
  }

  /**
   * Initializes the various state data structures such as _nodesInQueue and _nodesCompleted.
   */
  _initializeAuxiliaryData() {
    this._nodeTiming = new Map();
    this._nodesUnprocessed = new Set();
    this._nodesCompleted = new Set();
    this._nodesInProgress = new Set();
    this._nodesInQueue = new Set(); // TODO: replace this with priority queue
    this._connectionsInUse = new Set();
    this._numberInProgressByType = new Map();
  }

  /**
   * @param {string} type
   * @return {number}
   */
  _numberInProgress(type) {
    return this._numberInProgressByType.get(type) || 0;
  }

  /**
   * @param {!Node} node
   * @param {!NodeTimingData} values
   */
  _setTimingData(node, values) {
    const timingData = this._nodeTiming.get(node) || {};
    Object.assign(timingData, values);
    this._nodeTiming.set(node, timingData);
  }

  /**
   * @param {!Node} node
   * @param {number} queuedTime
   */
  _markNodeAsInQueue(node, queuedTime) {
    this._nodesInQueue.add(node);
    this._nodesUnprocessed.delete(node);
    this._setTimingData(node, {queuedTime});
  }

  /**
   * @param {!Node} node
   * @param {number} startTime
   */
  _markNodeAsInProgress(node, startTime) {
    this._nodesInQueue.delete(node);
    this._nodesInProgress.add(node);
    this._numberInProgressByType.set(node.type, this._numberInProgress(node.type) + 1);
    this._setTimingData(node, {startTime});
  }

  /**
   * @param {!Node} node
   * @param {number} endTime
   */
  _markNodeAsComplete(node, endTime) {
    this._nodesCompleted.add(node);
    this._nodesInProgress.delete(node);
    this._numberInProgressByType.set(node.type, this._numberInProgress(node.type) - 1);
    this._setTimingData(node, {endTime});

    // Try to add all its dependents to the queue
    for (const dependent of node.getDependents()) {
      // Skip dependent node if one of its dependencies hasn't finished yet
      const dependencies = dependent.getDependencies();
      if (dependencies.some(dependency => !this._nodesCompleted.has(dependency))) continue;

      // Otherwise add it to the queue
      this._markNodeAsInQueue(dependent, endTime);
    }
  }

  /**
   * @param {!Node} node
   * @param {number} totalElapsedTime
   */
  _startNodeIfPossible(node, totalElapsedTime) {
    if (node.type === Node.TYPES.CPU) {
      // Start a CPU task if there's no other CPU task in process
      if (this._numberInProgress(node.type) === 0) {
        this._markNodeAsInProgress(node, totalElapsedTime);
        this._setTimingData(node, {timeElapsed: 0});
      }

      return;
    }

    if (node.type !== Node.TYPES.NETWORK) throw new Error('Unsupported');

    const connection = this._connections.get(node.record.connectionId);
    const numberOfActiveRequests = this._numberInProgress(node.type);

    // Start a network request if the connection isn't in use and we're not at max requests
    if (
      numberOfActiveRequests >= this._maximumConcurrentRequests ||
      this._connectionsInUse.has(connection)
    ) {
      return;
    }

    this._markNodeAsInProgress(node, totalElapsedTime);
    this._setTimingData(node, {
      timeElapsed: 0,
      timeElapsedOvershoot: 0,
      bytesDownloaded: 0,
    });

    this._connectionsInUse.add(connection);
  }

  /**
   * Updates each connection in use with the available throughput based on the number of network requests
   * currently in flight.
   */
  _updateNetworkCapacity() {
    for (const connection of this._connectionsInUse) {
      connection.setThroughput(this._throughput / this._nodesInProgress.size);
    }
  }

  /**
   * Estimates the number of milliseconds remaining given current condidtions before the node is complete.
   * @param {!Node} node
   * @return {number}
   */
  _estimateTimeRemaining(node) {
    if (node.type === Node.TYPES.CPU) {
      const timingData = this._nodeTiming.get(node);
      const totalDuration = Math.round(node.event.dur / 1000 * this._cpuMultiplier);
      const estimatedTimeElapsed = totalDuration - timingData.timeElapsed;
      this._setTimingData(node, {estimatedTimeElapsed});
      return estimatedTimeElapsed;
    }

    if (node.type !== Node.TYPES.NETWORK) throw new Error('Unsupported');

    const timingData = this._nodeTiming.get(node);
    const connection = this._connections.get(node.record.connectionId);
    const calculation = connection.simulateDownloadUntil(
      node.record.transferSize - timingData.bytesDownloaded,
      timingData.timeElapsed
    );

    const estimatedTimeElapsed = calculation.timeElapsed + timingData.timeElapsedOvershoot;
    this._setTimingData(node, {estimatedTimeElapsed});
    return estimatedTimeElapsed;
  }

  /**
   * Computes and returns the minimum estimated completion time of the nodes currently in progress.
   * @return {number}
   */
  _findNextNodeCompletionTime() {
    let minimumTime = Infinity;
    for (const node of this._nodesInProgress) {
      minimumTime = Math.min(minimumTime, this._estimateTimeRemaining(node));
    }

    return minimumTime;
  }

  /**
   * Given a time period, computes the progress toward completion that the node made durin that time.
   * @param {!Node} node
   * @param {number} timePeriodLength
   * @param {number} totalElapsedTime
   */
  _updateProgressMadeInTimePeriod(node, timePeriodLength, totalElapsedTime) {
    const timingData = this._nodeTiming.get(node);
    const isFinished = timingData.estimatedTimeElapsed === timePeriodLength;

    if (node.type === Node.TYPES.CPU) {
      return isFinished
        ? this._markNodeAsComplete(node, totalElapsedTime)
        : (timingData.timeElapsed += timePeriodLength);
    }

    if (node.type !== Node.TYPES.NETWORK) throw new Error('Unsupported');

    const connection = this._connections.get(node.record.connectionId);
    const calculation = connection.simulateDownloadUntil(
      node.record.transferSize - timingData.bytesDownloaded,
      timingData.timeElapsed,
      timePeriodLength - timingData.timeElapsedOvershoot
    );

    connection.setCongestionWindow(calculation.congestionWindow);

    if (isFinished) {
      connection.setWarmed(true);
      this._connectionsInUse.delete(connection);
      this._markNodeAsComplete(node, totalElapsedTime);
    } else {
      timingData.timeElapsed += calculation.timeElapsed;
      timingData.timeElapsedOvershoot += calculation.timeElapsed - timePeriodLength;
      timingData.bytesDownloaded += calculation.bytesDownloaded;
    }
  }

  /**
   * Estimates the time taken to process all of the graph's nodes.
   * @return {{timeInMs: number, nodeTiming: !Map<!Node, !NodeTimingData>}}
   */
  estimateWithDetails() {
    // initialize all the necessary data containers
    this._initializeNetworkRecords();
    this._initializeNetworkConnections();
    this._initializeAuxiliaryData();

    const nodesUnprocessed = this._nodesUnprocessed;
    const nodesInQueue = this._nodesInQueue;
    const nodesInProgress = this._nodesInProgress;

    const rootNode = this._graph.getRootNode();
    rootNode.traverse(node => nodesUnprocessed.add(node));

    let depth = 0;
    let totalElapsedTime = 0;

    // add root node to queue
    this._markNodeAsInQueue(rootNode, totalElapsedTime);

    // loop as long as we have nodes in the queue or currently in progress
    while (nodesInQueue.size || nodesInProgress.size) {
      depth++;

      // move all possible queued nodes to in progress
      for (const node of nodesInQueue) {
        this._startNodeIfPossible(node, totalElapsedTime);
      }

      // set the available throughput for all connections based on # inflight
      this._updateNetworkCapacity();

      // find the time that the next node will finish
      const minimumTime = this._findNextNodeCompletionTime();
      totalElapsedTime += minimumTime;

      // update how far each node will progress until that point
      for (const node of nodesInProgress) {
        this._updateProgressMadeInTimePeriod(node, minimumTime, totalElapsedTime);
      }

      if (depth > 10000) {
        throw new Error('Maximum depth exceeded: estimate');
      }
    }

    if (nodesUnprocessed.size !== 0) {
      throw new Error(`Cycle detected: ${nodesUnprocessed.size} unused nodes`);
    }

    return {
      timeInMs: totalElapsedTime,
      nodeTiming: this._nodeTiming,
    };
  }

  /**
   * @return {number}
   */
  estimate() {
    return this.estimateWithDetails().timeInMs;
  }
}

module.exports = Estimator;

/**
 * @typedef {{
 *    estimatedTimeElapsed: number|undefined,
 *    timeElapsed: number|undefined,
 *    timeElapsedOvershoot: number|undefined,
 *    bytesDownloaded: number|undefined,
 * }}
 */
Estimator.NodeTimingData; // eslint-disable-line no-unused-expressions
