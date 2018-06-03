/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('./audit');
const traceSaverThings = require('./../lib/lantern-trace-saver');

class Metrics extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      name: 'generate-har',
      scoreDisplayMode: Audit.SCORING_MODES.INFORMATIVE,
      description: 'HAR File',
      helpText: 'Makes a har',
      requiredArtifacts: ['traces', 'devtoolsLogs'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const metricComputationData = {
      trace,
      devtoolsLog,
      settings: context.settings
    };

    const traceOfTab = await artifacts.requestTraceOfTab(trace);
    const interactive = await artifacts.requestInteractive(metricComputationData);

    const timings = interactive.pessimisticEstimate.nodeTimings;
    const {traceEvents} = traceSaverThings.convertNodeTimingsToTrace(timings);

    const protocolEvents = traceEvents.map(event => {

      'ResourceSendRequest' // Network.requestWillBeSent
      'ResourceReceiveResponse', // Network.responseReceive
      'ResourceFinish', // Network.loadingFinished
      // and i think we need to fake two events for
          // Page.domContentEventFired;
          // Page.loadEventFired;

          return {
            pageref,
            startedDateTime,
            time,
            request: {
                method,
                url,
                httpVersion,
                cookies: [], // TODO
                headers: headers.request.pairs,
                queryString,
                headersSize: headers.request.size,
                bodySize: payload.request.bodySize,
                postData
            },
            response: {
                status,
                statusText,
                httpVersion,
                cookies: [], // TODO
                headers: headers.response.pairs,
                redirectURL,
                headersSize: headers.response.size,
                bodySize: payload.response.bodySize,
                _transferSize: payload.response.transferSize,
                content: {
                    size: entry.responseLength,
                    mimeType,
                    compression: payload.response.compression,
                    text: entry.responseBody,
                    encoding
                }
            },
            cache: {},
            _fromDiskCache: response.fromDiskCache,
            timings,
            serverIPAddress,
            connection,
            _initiator,
            _priority
        };
    });



    /** @type {MetricsDetails} */
    const details = {
      items: [metrics]
    };

    return {
      score: 1,
      rawValue: interactive.timing,
      details,
    };
  }
}

module.exports = Metrics;
