/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('./audit');
const Util = require('../report/v2/renderer/util.js');
const PageDependencyGraph = require('../gather/computed/page-dependency-graph.js');
const Node = require('../gather/computed/dependency-graph/node.js');

// Parameters (in ms) for log-normal CDF scoring. To see the curve:
//   https://www.desmos.com/calculator/rjp0lbit8y
const SCORING_POINT_OF_DIMINISHING_RETURNS = 1700;
const SCORING_MEDIAN = 10000;

// Any CPU task of 20 ms or more will end up being a critical long task on mobile
const CRITICAL_LONG_TASK_THRESHOLD = 20;

class PredictivePerf extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      category: 'Performance',
      name: 'predictive-perf',
      description: 'Predicted Performance (beta)',
      helpText: 'Predicted performance evaluates how your site will perform under ' +
          'a 3G connection on a mobile device.',
      scoringMode: Audit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ['traces', 'devtoolsLogs'],
    };
  }

  /**
   * @param {!Node} dependencyGraph
   * @param {!TraceOfTabArtifact} traceOfTab
   * @return {!Node}
   */
  static getOptimisticFMPGraph(dependencyGraph, traceOfTab) {
    const fmp = traceOfTab.timestamps.firstMeaningfulPaint;
    return dependencyGraph.cloneWithRelationships(node => {
      if (node.endTime > fmp) return false;
      return node.isRenderBlocking();
    });
  }

  /**
   * @param {!Node} dependencyGraph
   * @param {!TraceOfTabArtifact} traceOfTab
   * @return {!Node}
   */
  static getPessimisticFMPGraph(dependencyGraph, traceOfTab) {
    const fmp = traceOfTab.timestamps.firstMeaningfulPaint;
    return dependencyGraph.cloneWithRelationships(node => {
      if (node.endTime > fmp) return false;
      // Include CPU tasks that performed a layout
      if (node.type === Node.TYPES.CPU) return node.didPerformLayout();
      // Include every request before FMP that wasn't an image
      return node.resourceType !== 'image';
    });
  }

  /**
   * @param {!Node} dependencyGraph
   * @return {!Node}
   */
  static getOptimisticTTCIGraph(dependencyGraph) {
    // Adjust the critical long task threshold for microseconds
    const minimumCpuTaskDuration = CRITICAL_LONG_TASK_THRESHOLD * 1000;

    return dependencyGraph.cloneWithRelationships(node => {
      // Include everything that might be a long task
      if (node.type === Node.TYPES.CPU) return node.event.dur > minimumCpuTaskDuration;
      // Include all scripts and high priority requests
      return node.resourceType === 'script' ||
          node.record.priority() === 'High' ||
          node.record.priority() === 'VeryHigh';
    });
  }

  /**
   * @param {!Node} dependencyGraph
   * @return {!Node}
   */
  static getPessimisticTTCIGraph(dependencyGraph) {
    return dependencyGraph;
  }

  /**
   * @param {!Map<!Node, {startTime, endTime}>} nodeTiming
   * @return {number}
   */
  static getLastLongTaskEndTime(nodeTiming) {
    return Array.from(nodeTiming.entries())
      .filter(([node, timing]) => node.type === Node.TYPES.CPU &&
          timing.endTime - timing.startTime > 50)
      .map(([_, timing]) => timing.endTime)
      .reduce((max, x) => Math.max(max, x), 0);
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const devtoolsLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    return Promise.all([
      artifacts.requestPageDependencyGraph(trace, devtoolsLogs),
      artifacts.requestTraceOfTab(trace),
    ]).then(([graph, traceOfTab]) => {
      const graphs = {
        optimisticFMP: PredictivePerf.getOptimisticFMPGraph(graph, traceOfTab),
        pessimisticFMP: PredictivePerf.getPessimisticFMPGraph(graph, traceOfTab),
        optimisticTTCI: PredictivePerf.getOptimisticTTCIGraph(graph, traceOfTab),
        pessimisticTTCI: PredictivePerf.getPessimisticTTCIGraph(graph, traceOfTab),
      };

      let sum = 0;
      const values = {};
      Object.keys(graphs).forEach(key => {
        const estimate = PageDependencyGraph.estimateGraph(graphs[key]);
        const lastLongTaskEnd = PredictivePerf.getLastLongTaskEndTime(estimate.nodeTiming);

        switch (key) {
          case 'optimisticFMP':
          case 'pessimisticFMP':
            values[key] = estimate.timeInMs;
            break;
          case 'optimisticTTCI':
            values[key] = Math.max(values.optimisticFMP, lastLongTaskEnd);
            break;
          case 'pessimisticTTCI':
            values[key] = Math.max(values.pessimisticFMP, lastLongTaskEnd);
            break;
        }

        sum += values[key];
      });

      const meanDuration = sum / Object.keys(values).length;
      const score = Audit.computeLogNormalScore(
          meanDuration,
          SCORING_POINT_OF_DIMINISHING_RETURNS,
          SCORING_MEDIAN
      );

      return {
        score,
        rawValue: meanDuration,
        displayValue: Util.formatMilliseconds(meanDuration),
        extendedInfo: {value: values},
      };
    });
  }
}

module.exports = PredictivePerf;
