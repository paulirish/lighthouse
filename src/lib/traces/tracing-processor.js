/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

if (typeof global.window === 'undefined') {
  global.window = global;
}

// we need gl-matrix and jszip for traceviewer
// since it has internal forks for isNode and they get mixed up during
// browserify, we require them locally here and global-ize them.

// from catapult/tracing/tracing/base/math.html
const glMatrixModule = require('gl-matrix');
Object.keys(glMatrixModule).forEach(exportName => {
  global[exportName] = glMatrixModule[exportName];
});
// from catapult/tracing/tracing/extras/importer/jszip.html
global.JSZip = require('jszip/dist/jszip.min.js');

global.HTMLImportsLoader = {};
global.HTMLImportsLoader.hrefToAbsolutePath = function(path) {
  if (path === '/gl-matrix-min.js') {
    return 'empty-module';
  }
  if (path === '/jszip.min.js') {
    return 'jszip/dist/jszip.min.js';
  }
};

require('../../../third_party/traceviewer-js/');
const traceviewer = global.tr;

class TraceProcessor {
  get RESPONSE() {
    return 'Response';
  }

  get ANIMATION() {
    return 'Animation';
  }

  get LOAD() {
    return 'Load';
  }

  init(contents) {
    let contentsJSON = null;

    try {
      contentsJSON = typeof contents === 'string' ? JSON.parse(contents) :
          contents;

      // If the file already wrapped the trace events in a
      // traceEvents object, grab the contents of the object.
      if (contentsJSON !== null &&
        typeof contentsJSON.traceEvents !== 'undefined') {
        contentsJSON = contentsJSON.traceEvents;
      }
    } catch (e) {
      throw new Error('Invalid trace contents: ' + e.message);
    }

    const events = [JSON.stringify({
      traceEvents: contentsJSON
    })];

    return this.convertEventsToModel(events);
  }

  // Create the importer and import the trace contents to a model.
  convertEventsToModel(events) {
    const io = new traceviewer.importer.ImportOptions();
    io.showImportWarnings = false;
    io.pruneEmptyContainers = false;
    io.shiftWorldToZero = true;

    const model = new traceviewer.Model();
    const importer = new traceviewer.importer.Import(model, io);
    importer.importTraces(events);

    return model;
  }

  static kahanSum(arr) {
    var sum = 0;
    var error = 0;
    for (var i = 0; i < arr.length; i++) {
      var correctedNextTerm = arr[i] - error;
      var nextSum = sum + correctedNextTerm;
      error = (nextSum - sum) - correctedNextTerm;
      sum = nextSum;
    }
    return sum;
  }

  static _findMainThread(model, processId, threadId) {
    const modelHelper = model.getOrCreateHelper(traceviewer.model.helpers.ChromeModelHelper);
    const renderHelpers = traceviewer.b.dictionaryValues(modelHelper.rendererHelpers);
    const mainThread = renderHelpers.find(helper => {
      return helper.mainThread &&
        helper.pid === processId &&
        helper.mainThread.tid === threadId;
    }).mainThread;

    return mainThread;
  }

  static getRiskToResponsiveness(trace, startTime) {
    // TODO(bckenny): can just filter for top level slices in our process/thread ourselves?
    const tracingProcessor = new TraceProcessor();
    const model = tracingProcessor.init(trace);

    // Find the main thread.
    const startEvent = trace.find(event => {
      return event.name === 'TracingStartedInPage';
    });
    const mainThread = TraceProcessor._findMainThread(model, startEvent.pid, startEvent.tid);

    // Range of input readiness we care about.
    const interactiveRange = traceviewer.b.Range.fromExplicitRange(startTime, model.bounds.max);

    // TODO(bckenny): tests for percentiles at < idleTime and near 1
    // normalize and sort array of percentiles requested?
    // tests where all durations are same length
    // make sure tasks at ends are included (and clip them to range)

    const durations = [];
    let busyTime = 0;
    let busyError = 0;
    mainThread.sliceGroup.topLevelSlices.forEach(slice => {
      if (!interactiveRange.intersectsExplicitRangeExclusive(slice.start, slice.end)) {
        return;
      }

      durations.push(slice.duration);
      const duration = slice.duration - busyError;
      const tmpTotal = busyTime + duration;
      busyError = (tmpTotal - busyTime) - duration;
      busyTime = tmpTotal;
    });

    durations.sort((a, b) => a - b);
    const totalTime = model.bounds.max - startTime;

    console.log('num of tasks:', durations.length, 'over', totalTime + 'ms');
    console.log('max task length:', durations[durations.length - 1] + 'ms');
    console.log('second max task length:', durations[durations.length - 2] + 'ms');

    let completedTime = totalTime - busyTime;
    let x = 0;
    let cdfValue = completedTime / totalTime;
    let nextX = 0;
    let nextCdfValue = cdfValue;
    let durationIndex = -1;
    const results = [];

    // Find percentiles of interest in order.
    for (let percentile of [0.5, 0.75, 0.9, 0.99, 1]) {
      // Loop over each duration, calculating a CDF value for each, until the
      // next CDF value is above target percentile.
      while (nextCdfValue < percentile) {
        completedTime += nextX;
        x = nextX;
        cdfValue = nextCdfValue;
        durationIndex++;
        nextX = durations[durationIndex];

        const remainingCount = durations.length - durationIndex;
        if (remainingCount === 1) {
          // At the end of the duration array, just cap CDF value to 1 to avoid numerical issues.
          nextCdfValue = 1;
        } else {
          nextCdfValue = (completedTime + nextX * remainingCount) / totalTime;
        }
      }

      // Interpolate between previous and next CDF values to find precise time of percentile.
      const t = nextCdfValue === cdfValue ? 0 : (percentile - cdfValue) / (nextCdfValue - cdfValue);
      results.push({
        percentile,
        time: x * (1 - t) + nextX * t
      });
    }

    return results;
  }

  /**
   * Uses traceviewer's statistics package to create a log-normal distribution.
   * Specified by providing the median value, at which the score will be 0.5,
   * and the falloff, the initial point of diminishing returns where any
   * improvement in value will yield increasingly smaller gains in score. Both
   * values should be in the same units (e.g. milliseconds). See
   *   https://www.desmos.com/calculator/tx1wcjk8ch
   * for an interactive view of the relationship between these parameters and
   * the typical parameterization (location and shape) of the log-normal
   * distribution.
   * @param {number} median
   * @param {number} falloff
   * @return {!Statistics.LogNormalDistribution}
   */
  static getLogNormalDistribution(median, falloff) {
    const location = Math.log(median);

    // The "falloff" value specified the location of the smaller of the positive
    // roots of the third derivative of the log-normal CDF. Calculate the shape
    // parameter in terms of that value and the median.
    const logRatio = Math.log(falloff / median);
    const shape = 0.5 * Math.sqrt(1 - 3 * logRatio -
        Math.sqrt((logRatio - 3) * (logRatio - 3) - 8));

    return new traceviewer.b.Statistics.LogNormalDistribution(location, shape);
  }
}

module.exports = TraceProcessor;
