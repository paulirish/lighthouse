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

const DevtoolsTimelineModel = require('devtools-timeline-model');

class FirstMeaningfulPaint {
  /**
   * @param {!Array<!Object>} traceData
   */
  static parse(traceData) {
    const model = new DevtoolsTimelineModel(traceData);
    const events = model.timelineModel().mainThreadEvents();

    // Identify the frameID of the main frame
    const startedInPage = model.tracingModel().devToolsMetadataEvents()
      .filter(e => e.name === 'TracingStartedInPage').slice(-1);
    const frameID = startedInPage[0].args.data.page;

    // Find the start of navigation and our meaningful paint
    const userTiming = events
      .filter(e => e.categoriesString.includes('blink.user_timing'))
      .sort((a, b) => b.ts - a.ts);
    const navStart = userTiming.filter(e => {
      return e.name === 'navigationStart' && e.args.frame === frameID;
    }).slice(-1);
    const conPaint = userTiming.filter(e => {
      return e.name === 'firstContentfulPaint' && e.args.frame === frameID;
    }).slice(-1);

    // report the raw numbers
    if (conPaint.length && navStart.length) {
      return Promise.resolve({
        navigationStart: navStart[0].startTime,
        firstMeaningfulPaint: conPaint[0].startTime
      });
    }
    return Promise.resolve(new Error('First meaningful paint metric not found'));
  }
}

module.exports = FirstMeaningfulPaint;
