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

const defaultConfig = require('./default.json');
const recordsFromLogs = require('../lib/network-recorder').recordsFromLogs;
const CriticalRequestChainsGatherer = require('../gather/gatherers/critical-request-chains');
const SpeedlineGatherer = require('../gather/gatherers/speedline');

const GatherRunner = require('../gather/gather-runner');
const log = require('../lib/log');

// cleanTrace is run to remove duplicate TracingStartedInPage events,
// and to change TracingStartedInBrowser events into TracingStartedInPage.
// This is done by searching for most occuring threads and basing new events
// off of those.
function cleanTrace(trace) {
  const traceEvents = trace.traceEvents;
  // Keep track of most occuring threads
  const threads = [];
  const countsByThread = {};
  const traceStartEvents = [];
  const makeMockEvent = (evt, ts) => {
    return {
      pid: evt.pid,
      tid: evt.tid,
      ts: ts || 0,  // default to 0 for now
      ph: 'I',
      cat: 'disabled-by-default-devtools.timeline',
      name: 'TracingStartedInPage',
      args: {
        data: {
          page: evt.frame
        }
      },
      s: 't'
    };
  };

  let frame;
  let data;
  let name;
  let counter;

  traceEvents.forEach((evt, idx) => {
    if (evt.name.startsWith('TracingStartedIn')) {
      traceStartEvents.push(idx);
    }

    // find the event's frame
    data = evt.args && (evt.args.data || evt.args.beginData || evt.args.counters);
    frame = (evt.args && evt.args.frame) || data && (data.frame || data.page);

    if (!frame) {
      return;
    }

    // Increase occurences count of the frame
    name = `pid${evt.pid}-tid${evt.tid}-frame${frame}`;
    counter = countsByThread[name];
    if (!counter) {
      counter = {
        pid: evt.pid,
        tid: evt.tid,
        frame: frame,
        count: 0
      };
      countsByThread[name] = counter;
      threads.push(counter);
    }
    counter.count++;
  });

  // find most active thread (and frame)
  threads.sort((a, b) => b.count - a.count);
  const mostActiveFrame = threads[0];

  // Remove all current TracingStartedIn* events, storing
  // the first events ts.
  const ts = traceEvents[traceStartEvents[0]] && traceEvents[traceStartEvents[0]].ts;

  // account for offset after removing items
  let i = 0;
  for (let dup of traceStartEvents) {
    traceEvents.splice(dup - i, 1);
    i++;
  }

  // Add a new TracingStartedInPage event based on most active thread
  // and using TS of first found TracingStartedIn* event
  traceEvents.unshift(makeMockEvent(mostActiveFrame, ts));

  return trace;
}

function filterPasses(passes, audits) {
  const requiredGatherers = getGatherersNeededByAudits(audits);

  // Make sure we only have the gatherers that are needed by the audits
  // that have been listed in the config.
  const filteredPasses = passes.map(pass => {
    const freshPass = Object.assign({}, pass);

    freshPass.gatherers = freshPass.gatherers.filter(gatherer => {
      try {
        const GathererClass = GatherRunner.getGathererClass(gatherer);
        return requiredGatherers.has(GathererClass.name);
      } catch (requireError) {
        throw new Error(`Unable to locate gatherer: ${gatherer}`);
      }
    });

    return freshPass;
  })

  // Now remove any passes which no longer have gatherers.
  .filter(p => p.gatherers.length > 0);
  return filteredPasses;
}

function getGatherersNeededByAudits(audits) {
  // It's possible we didn't get given any audits (but existing audit results), in which case
  // there is no need to do any work here.
  if (!audits) {
    return new Set();
  }

  return audits.reduce((list, audit) => {
    audit.meta.requiredArtifacts.forEach(artifact => list.add(artifact));
    return list;
  }, new Set());
}

function filterAudits(audits, auditWhitelist) {
  // If there is no whitelist, assume all.
  if (!auditWhitelist) {
    return Array.from(audits);
  }

  const rejected = [];
  const filteredAudits = audits.filter(a => {
    const auditName = a.toLowerCase();
    const inWhitelist = auditWhitelist.has(auditName);

    if (!inWhitelist) {
      rejected.push(auditName);
    }

    return inWhitelist;
  });

  if (rejected.length) {
    log.log('info', 'Running these audits:', `${filteredAudits.join(', ')}`);
    log.log('info', 'Skipping these audits:', `${rejected.join(', ')}`);
  }

  return filteredAudits;
}

function expandAudits(audits) {
  return audits.map(audit => {
    try {
      return require(`../audits/${audit}`);
    } catch (requireError) {
      throw new Error(`Unable to locate audit: ${audit}`);
    }
  });
}

function expandArtifacts(artifacts, includeSpeedline) {
  const expandedArtifacts = Object.assign({}, artifacts);

  // currently only trace logs and performance logs should be imported
  if (artifacts.traces) {
    Object.keys(artifacts.traces).forEach(key => {
      log.log('info', 'Normalizng trace contents into expected state...');
      let trace = require(artifacts.traces[key]);
      // Before Chrome 54.0.2816 (codereview.chromium.org/2161583004), trace was
      // an array of trace events. After this point, trace is an object with a
      // traceEvents property. Normalize to new format.
      if (Array.isArray(trace)) {
        trace = {
          traceEvents: trace
        };
      }
      trace = cleanTrace(trace);

      expandedArtifacts.traces[key] = trace;
    });
  }

  if (includeSpeedline) {
    const speedline = new SpeedlineGatherer();
    speedline.afterPass({}, {traceEvents: expandedArtifacts.traces.defaultPass.traceEvents});
    expandedArtifacts.Speedline = speedline.artifact;
  }

  if (artifacts.performanceLog) {
    expandedArtifacts.CriticalRequestChains =
      parsePerformanceLog(require(artifacts.performanceLog));
  }

  return expandedArtifacts;
}

function parsePerformanceLog(logs) {
  // Parse logs for network events
  const networkRecords = recordsFromLogs(logs);

  // Use critical request chains gatherer to create the critical request chains artifact
  const criticalRequestChainsGatherer = new CriticalRequestChainsGatherer();
  criticalRequestChainsGatherer.afterPass({}, {networkRecords});

  return criticalRequestChainsGatherer.artifact;
}

/**
 * @return {!Config}
 */
class Config {
  /**
   * @constructor
   * @param{Object} config
   */
  constructor(configJSON, auditWhitelist) {
    if (!configJSON) {
      configJSON = defaultConfig;
    }

    this._audits = configJSON.audits ? expandAudits(
        filterAudits(configJSON.audits, auditWhitelist)
        ) : null;
    // filterPasses expects audits to have been expanded
    this._passes = configJSON.passes ? filterPasses(configJSON.passes, this._audits) : null;
    this._auditResults = configJSON.auditResults ? Array.from(configJSON.auditResults) : null;
    this._artifacts = null;
    if (configJSON.artifacts) {
      this._artifacts = expandArtifacts(configJSON.artifacts,
          // If time-to-interactive is present, add the speedline artifact
          configJSON.audits && configJSON.audits.find(a => a === 'time-to-interactive'));
    }
    this._aggregations = configJSON.aggregations ? Array.from(configJSON.aggregations) : null;
  }

  /** @type {Array<!Pass>} */
  get passes() {
    return this._passes;
  }

  /** @type {Array<!Audit>} */
  get audits() {
    return this._audits;
  }

  /** @type {Array<!AuditResult>} */
  get auditResults() {
    return this._auditResults;
  }

  /** @type {Array<!Artifacts>} */
  get artifacts() {
    return this._artifacts;
  }

  /** @type {Array<!Aggregation>} */
  get aggregations() {
    return this._aggregations;
  }
}

module.exports = Config;
