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

const FAILURE_ERROR = new Error('Navigation and first paint timings not found');

class FirstMeaningfulPaint {

  /**
   * @param {!Array<!Object>} traceData
   */
  static parse(traceData) {
    return new Promise((resolve, reject) => {
      if (!traceData || !Array.isArray(traceData)) {
        return reject(FAILURE_ERROR);
      }

      const model = new DevtoolsTimelineModel(traceData);
      const events = model.timelineModel().mainThreadEvents();

      // Identify the frameID of the main frame
      const startedInPage = model.tracingModel().devToolsMetadataEvents()
        .filter(e => e.name === 'TracingStartedInPage')
        .sort((a, b) => a.startTime - b.startTime)
        .slice(-1);
      const frameID = startedInPage[0].args.data.page;

      // Find the start of navigation and our meaningful paint
      const userTiming = events
        .filter(e => e.categoriesString.includes('blink.user_timing'))
        // Events can be unsorted, so we put in ascending order.
        .sort((a, b) => a.startTime - b.startTime);

      // navigationStart == the network begins fetching the page URL
      // CommitLoad == the first bytes of HTML are returned and Chrome considers
      //   the navigation a success. A 'isMainFrame' boolean is attached to those events
      //   However, that flag may be incorrect now, so we're ignoring it.
      const navStart = userTiming.filter(e => {
        return e.name === 'navigationStart' && e.args.frame === frameID;
      }).slice(-1);

      // firstContentfulPaint == the first time that text or image content was
      // painted. See src/third_party/WebKit/Source/core/paint/PaintTiming.h
      const conPaint = userTiming.filter(e => {
        return e.name === 'firstContentfulPaint' && e.args.frame === frameID;
      }).slice(-1);

      // report the raw numbers
      if (conPaint.length && navStart.length) {
        const navigationStart = navStart[0].startTime;
        const firstMeaningfulPaint = conPaint[0].startTime;

        return resolve({
          navigationStart,
          firstMeaningfulPaint
        });
      }
      return reject(FAILURE_ERROR);
    });
  }
}

module.exports = FirstMeaningfulPaint;
