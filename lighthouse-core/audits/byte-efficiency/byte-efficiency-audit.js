/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('../audit');
const PredictivePerf = require('../predictive-perf');
const LoadSimulator = require('../../lib/dependency-graph/simulator/simulator.js');

const KB_IN_BYTES = 1024;

const WASTED_MS_FOR_AVERAGE = 300;
const WASTED_MS_FOR_POOR = 750;

/**
 * @overview Used as the base for all byte efficiency audits. Computes total bytes
 *    and estimated time saved. Subclass and override `audit_` to return results.
 */
class UnusedBytes extends Audit {
  /**
   * @param {number} wastedMs
   * @return {number}
   */
  static scoreForWastedMs(wastedMs) {
    if (wastedMs === 0) return 1.00;
    else if (wastedMs < WASTED_MS_FOR_AVERAGE) return .90;
    else if (wastedMs < WASTED_MS_FOR_POOR) return .65;
    else return 0;
  }

  /**
   * @param {number} bytes
   * @param {number} networkThroughput measured in bytes/second
   * @return {string}
   */
  static bytesToMs(bytes, networkThroughput) {
    const milliseconds = bytes / networkThroughput * 1000;
    return milliseconds;
  }

  /**
   * Estimates the number of bytes this network record would have consumed on the network based on the
   * uncompressed size (totalBytes), uses the actual transfer size from the network record if applicable.
   *
   * @param {?WebInspector.NetworkRequest} networkRecord
   * @param {number} totalBytes Uncompressed size of the resource
   * @param {string=} resourceType
   * @param {number=} compressionRatio
   * @return {number}
   */
  static estimateTransferSize(networkRecord, totalBytes, resourceType, compressionRatio = 0.5) {
    if (!networkRecord) {
      // We don't know how many bytes this asset used on the network, but we can guess it was
      // roughly the size of the content gzipped.
      // See https://discuss.httparchive.org/t/file-size-and-compression-savings/145 for multipliers
      return Math.round(totalBytes * compressionRatio);
    } else if (networkRecord._resourceType && networkRecord._resourceType._name === resourceType) {
      // This was a regular standalone asset, just use the transfer size.
      return networkRecord._transferSize;
    } else {
      // This was an asset that was inlined in a different resource type (e.g. HTML document).
      // Use the compression ratio of the resource to estimate the total transferred bytes.
      const compressionRatio = networkRecord._transferSize / networkRecord._resourceSize || 1;
      return Math.round(totalBytes * compressionRatio);
    }
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!Promise<!AuditResult>}
   */
  static audit(artifacts) {
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    return artifacts
      .requestNetworkRecords(devtoolsLog)
      .then(networkRecords =>
        Promise.all([
          this.audit_(artifacts, networkRecords),
          artifacts.requestPageDependencyGraph(trace, devtoolsLog),
        ])
      )
      .then(([result, graph]) => this.createAuditResult(result, graph));
  }

  /**
   * Computes the estimated effect of all the byte savings on the last long task
   * in the provided graph.
   *
   * @param {!Array<{url: string, wastedBytes: number}>} results The array of byte savings results per resource
   * @param {!Node} graph
   * @return {number}
   */
  static computeWasteWithTTIGraph(results, graph, simulator) {
    const simulationBeforeChanges = simulator.simulate();
    const resultsByUrl = new Map();
    for (const result of results) {
      resultsByUrl.set(result.url, result);
    }

    // Update all the transfer sizes to reflect implementing our recommendations
    graph.traverse(node => {
      if (node.type !== 'network') return;
      if (!resultsByUrl.has(node.record.url)) return;
      const original = node.record.transferSize;
      const wastedBytes = resultsByUrl.get(node.record.url).wastedBytes;
      // cloning NetworkRequest objects is difficult, so just stash the original transfer size
      node.record._originalTransferSize = original;
      node.record._transferSize = Math.max(original - wastedBytes, 0);
    });

    const simulationAfterChanges = simulator.simulate();
    // Restore the original transfer size after we've done our simulation
    graph.traverse(node => {
      if (node.type !== 'network') return;
      if (!node.record._originalTransferSize) return;
      node.record._transferSize = node.record._originalTransferSize;
    });

    const savingsOnTTI = Math.max(
      PredictivePerf.getLastLongTaskEndTime(simulationBeforeChanges.nodeTiming) -
        PredictivePerf.getLastLongTaskEndTime(simulationAfterChanges.nodeTiming),
      0
    );

    // Round waste to nearest 10ms
    return Math.round(savingsOnTTI / 10) * 10;
  }

  /**
   * @param {!Audit.HeadingsResult} result
   * @param {!Node} graph
   * @return {!AuditResult}
   */
  static createAuditResult(result, graph) {
    const simulatorOptions = PredictivePerf.computeRTTAndServerResponseTime(graph);
    const simulator = new LoadSimulator(graph, simulatorOptions);

    const debugString = result.debugString;
    const results = result.results.sort((itemA, itemB) => itemB.wastedBytes - itemA.wastedBytes);

    const wastedBytes = results.reduce((sum, item) => sum + item.wastedBytes, 0);
    const wastedKb = Math.round(wastedBytes / KB_IN_BYTES);
    const wastedMs = UnusedBytes.computeWasteWithTTIGraph(results, graph, simulator);

    let displayValue = result.displayValue || '';
    if (typeof result.displayValue === 'undefined' && wastedBytes) {
      displayValue = `Potential savings of ${wastedBytes} bytes`;
    }

    const summary = {
      wastedMs,
      wastedBytes,
    };
    const details = Audit.makeTableDetails(result.headings, results, summary);

    return {
      debugString,
      displayValue,
      rawValue: wastedMs,
      score: UnusedBytes.scoreForWastedMs(wastedMs),
      extendedInfo: {
        value: {
          wastedMs,
          wastedKb,
          results,
        },
      },
      details,
    };
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!Audit.HeadingsResult}
   */
  static audit_() {
    throw new Error('audit_ unimplemented');
  }
}

module.exports = UnusedBytes;
