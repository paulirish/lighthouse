/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const CpuProfileModel = require('../../../lib/tracehouse/cpu-profile-model.js');
const TraceProcessor = require('../../../lib/tracehouse/trace-processor.js');
const MainThreadTasks = require('../../../lib/tracehouse/main-thread-tasks.js');
const profilerTrace = require('../../fixtures/traces/cpu-profiler-m86.trace.json');
const CpuProfilerModel = require('../../../lib/tracehouse/cpu-profile-model.js');

describe('CPU Profiler Model', () => {
  /** @type {LH.TraceCpuProfile} */
  let profile;

  beforeEach(() => {
    /*
    An artistic rendering of the below profile:
    ████████████████(root)████████████████
    ███████████████(program)██████████████
    ███████████████Foo██████████████
      ██████Bar███████     █Baz█
        █Baz█
    */
    profile = {
      id: '0x1',
      pid: 1,
      tid: 1,
      startTime: 9e6,
      nodes: [
        {id: 0, callFrame: {functionName: '(root)'}},
        {id: 1, callFrame: {functionName: '(program)'}, parent: 0},
        {id: 2, callFrame: {functionName: 'Foo', url: 'fileA.js'}, parent: 1},
        {id: 3, callFrame: {functionName: 'Bar', url: 'fileA.js'}, parent: 2},
        {id: 4, callFrame: {functionName: 'Baz', url: 'fileA.js'}, parent: 3},
        {id: 5, callFrame: {functionName: 'Baz', url: 'fileB.js'}, parent: 2},
      ],
      samples: [2, 2, 3, 4, 3, 3, 2, 5, 1, 1],
      timeDeltas: [10e3, 1e3, 1e3, 1e3, 1e3, 1e3, 1e3, 1e3, 1e3, 1e3],
    };
  });

  describe('#createStartEndEvents', () => {
    it('should create events in order', () => {
      const ts = x => 9e6 + x;
      const events = CpuProfilerModel.createStartEndEvents(profile);

      expect(events).toMatchObject([
        {ph: 'B', ts: ts(10e3), args: {data: {callFrame: {functionName: '(root)'}}}},
        {ph: 'B', ts: ts(10e3), args: {data: {callFrame: {functionName: '(program)'}}}},
        {ph: 'B', ts: ts(10e3), args: {data: {callFrame: {functionName: 'Foo'}}}},
        {ph: 'B', ts: ts(12e3), args: {data: {callFrame: {functionName: 'Bar'}}}},
        {ph: 'B', ts: ts(13e3), args: {data: {callFrame: {functionName: 'Baz'}}}},
        {ph: 'E', ts: ts(14e3), args: {data: {callFrame: {functionName: 'Baz'}}}},
        {ph: 'E', ts: ts(16e3), args: {data: {callFrame: {functionName: 'Bar'}}}},
        {ph: 'B', ts: ts(17e3), args: {data: {callFrame: {functionName: 'Baz'}}}},
        {ph: 'E', ts: ts(18e3), args: {data: {callFrame: {functionName: 'Baz'}}}},
        {ph: 'E', ts: ts(18e3), args: {data: {callFrame: {functionName: 'Foo'}}}},
        {ph: 'E', ts: ts(19e3), args: {data: {callFrame: {functionName: '(program)'}}}},
        {ph: 'E', ts: ts(19e3), args: {data: {callFrame: {functionName: '(root)'}}}},
      ]);
    });

    it('should create main-thread-task parseable events', () => {
      const ts = x => 9e6 + x;
      const events = CpuProfilerModel.createStartEndEvents(profile);

      const tasks = MainThreadTasks.getMainThreadTasks(events, [], ts(19e3));
      expect(tasks).toHaveLength(6);
      expect(tasks[0]).toMatchObject({
        event: {args: {data: {callFrame: {functionName: '(root)'}}}},
        children: [
          {
            event: {args: {data: {callFrame: {functionName: '(program)'}}}},
            children: [{event: {args: {data: {callFrame: {functionName: 'Foo'}}}}}],
          },
        ],
      });

      const fooTask = tasks[0].children[0].children[0];
      expect(fooTask).toMatchObject({
        event: {args: {data: {callFrame: {functionName: 'Foo'}}}},
        children: [
          {
            event: {args: {data: {callFrame: {functionName: 'Bar'}}}},
            children: [{event: {args: {data: {callFrame: {functionName: 'Baz'}}}}}],
          },
          {
            event: {args: {data: {callFrame: {functionName: 'Baz'}}}},
            children: [],
          },
        ],
      });
    });

    it('should work on a real trace', () => {
      const {processEvents} = TraceProcessor.computeTraceOfTab(profilerTrace);
      const profiles = CpuProfileModel.collectProfileEvents(processEvents);
      const events = CpuProfileModel.createStartEndEvents(profiles[0]);
      expect(events).toHaveLength(230);
      const lastTs = events[events.length - 1].length;
      const tasks = MainThreadTasks.getMainThreadTasks(events, [], lastTs);
      expect(tasks).toHaveLength(115);
    });
  });

  describe('#collectProfileEvents', () => {
    const nodes = [{id: 0}, {id: 1}];
    const samples = [0, 1, 0, 1];
    const timeDeltas = [10, 5, 5, 5];
    /** @param {Record<string, any>} data */
    const args = data => ({args: {data}});

    it('should extract profiles', () => {
      const cpuProfile = {nodes, samples, timeDeltas};
      const traceEvents = [
        {id: 'A', name: 'Profile', pid: 1, tid: 2, ...args({startTime: 1234, cpuProfile})},
        {id: 'B', name: 'Profile', pid: 1, tid: 3, ...args({startTime: 2345, cpuProfile})},
      ];

      const profiles = CpuProfileModel.collectProfileEvents(traceEvents);
      expect(profiles).toEqual([
        {id: 'A', pid: 1, tid: 2, startTime: 1234, nodes, samples, timeDeltas},
        {id: 'B', pid: 1, tid: 3, startTime: 2345, nodes, samples, timeDeltas},
      ]);
    });

    it('should ignore profiles without an ID', () => {
      const cpuProfile = {nodes, samples, timeDeltas};
      const traceEvents = [
        {name: 'Profile', pid: 1, tid: 2, ...args({startTime: 1234, cpuProfile})},
        {id: 'missing', name: 'ProfileChunk', pid: 1, tid: 3, ...args({cpuProfile})},
      ];

      const profiles = CpuProfileModel.collectProfileEvents(traceEvents);
      expect(profiles).toEqual([]);
    });

    it('should handle definition of a profile across multiple events', () => {
      const traceEvents = [
        {id: 'A', name: 'Profile', pid: 1, tid: 2, ...args({startTime: 1234})},
        {id: 'B', name: 'Profile', ts: 1235, pid: 1, tid: 3, ...args({cpuProfile: {nodes}})},
        {id: 'A', name: 'ProfileChunk', ts: 2345, pid: 1, tid: 2, ...args({cpuProfile: {nodes}})},
        {id: 'A', name: 'ProfileChunk', ts: 3456, pid: 1, tid: 2, ...args({cpuProfile: {samples}})},
        {id: 'A', name: 'ProfileChunk', ts: 4567, pid: 1, tid: 2, ...args({timeDeltas})},
      ];

      const profiles = CpuProfileModel.collectProfileEvents(traceEvents);
      expect(profiles).toEqual([
        {id: 'A', pid: 1, tid: 2, startTime: 1234, nodes, samples, timeDeltas},
        {id: 'B', pid: 1, tid: 3, startTime: 1235, nodes, samples: [], timeDeltas: []},
      ]);
    });

    it('should work on a real trace', () => {
      const {processEvents} = TraceProcessor.computeTraceOfTab(profilerTrace);
      const profiles = CpuProfileModel.collectProfileEvents(processEvents);
      expect(profiles).toMatchObject([
        {
          id: '0x2',
          pid: 9318,
          tid: 775,
          startTime: 459852380794,
        },
      ]);

      expect(profiles[0]).toHaveProperty('nodes');
      expect(profiles[0].samples).toHaveLength(profiles[0].timeDeltas.length);
    });
  });
});
