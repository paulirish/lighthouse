'use strict';

/* global describe, it, WebInspector */

const fs = require('fs');
const assert = require('assert');
const TraceToTimelineModel = require('../../../../src/lib/traces/devtools-timeline-model');

const filename = 'devtools-homepage-w-screenshots-trace.json';
const events = fs.readFileSync('../../../fixtures/traces/' + filename, 'utf8');
let model;

describe('DevTools Timeline Model', function() {
  it('doesn\'t throw an exception', () => {
    assert.doesNotThrow(_ => {
      model = new TraceToTimelineModel(events);
    });
  });

  it.skip('Array native globals dont leak', () => {
    assert.equal(Array.prototype.peekLast, undefined);
  });

  it.skip('WebInspector global doesn\'t leak', () => {
    assert.equal(typeof WebInspector, 'undefined');
  });

  it('Multiple instances don\'t conflict', () => {
    let model1;
    let model2;
    assert.doesNotThrow(_ => {
      model1 = new TraceToTimelineModel(events);
      model2 = new TraceToTimelineModel(events);
    });
    const events1 = model1.timelineModel().mainThreadEvents().length;
    const events2 = model2.timelineModel().mainThreadEvents().length;
    assert.equal(events1, events2);
  });

  it('metrics returned are expected', () => {
    assert.equal(model.timelineModel().mainThreadEvents().length, 7228);
    assert.equal(model.interactionModel().interactionRecords().length, 0);
    assert.equal(model.frameModel().frames().length, 16);
  });

  it('top-down profile', () => {
    const leaves = [...model.topDown().children.entries()].length;
    assert.equal(leaves, 28);
    const time = model.topDown().totalTime.toFixed(2);
    assert.equal(time, '559.21');
  });

  it('bottom-up profile', () => {
    const leaves = [...model.bottomUp().children.entries()].length;
    assert.equal(leaves, 243);
    const topCosts = [...model.bottomUpGroupBy('URL').children.values()];
    const time = topCosts[1].totalTime.toFixed(2);
    const url = topCosts[1].id;
    assert.equal(time, '80.77');
    assert.equal(url, 'https://s.ytimg.com/yts/jsbin/www-embed-lightweight-vflu_2b1k/www-embed-lightweight.js');
  });

  it('bottom-up profile - group by eventname', () => {
    const bottomUpByName = model.bottomUpGroupBy('EventName');
    const leavesCount = bottomUpByName.children.size;
    assert.equal(leavesCount, 15);
    const result = new Map();
    bottomUpByName.children.forEach(function(value, key) {
      result.set(key, value.selfTime);
    });
    const time = [...result.values()][0].toFixed(2);
    const name = [...result.keys()][0];
    assert.equal(time, '187.75');
    assert.equal(name, 'Layout');
  });
});
