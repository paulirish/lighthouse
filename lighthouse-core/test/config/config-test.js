/**
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

const Config = require('../../config/config');
const assert = require('assert');
const path = require('path');
const defaultConfig = require('../../config/default.json');

/* eslint-env mocha */

describe('Config', () => {
  it('returns new object', () => {
    const config = {
      audits: ['is-on-https']
    };
    const newConfig = new Config(config);
    assert.notEqual(config, newConfig);
  });

  it('uses the default config when no config is provided', () => {
    const config = new Config();
    assert.deepStrictEqual(defaultConfig.aggregations, config.aggregations);
    assert.equal(defaultConfig.audits.length, config.audits.length);
  });

  it('throws for unknown gatherers', () => {
    const config = {
      passes: [{
        gatherers: ['fuzz']
      }],
      audits: [
        'is-on-https'
      ]
    };

    return assert.throws(_ => new Config(config),
        /Unable to locate/);
  });

  it('filters gatherers from passes when no audits require them', () => {
    const config = new Config({
      passes: [{
        gatherers: [
          'url',
          'html',
          'critical-request-chains'
        ]
      }],

      audits: ['critical-request-chains']
    });

    assert.equal(config.passes[0].gatherers.length, 1);
  });

  it('doesn\'t mutate old gatherers when filtering passes', () => {
    const configJSON = {
      passes: [{
        gatherers: [
          'url',
          'https',
          'viewport'
        ]
      }],
      audits: ['is-on-https']
    };

    const _ = new Config(configJSON);
    assert.equal(configJSON.passes[0].gatherers.length, 3);
  });

  it('contains new copies of auditResults and aggregations', () => {
    const configJSON = defaultConfig;
    configJSON.auditResults = [{
      value: 1,
      rawValue: 1.0,
      optimalValue: 1.0,
      name: 'Test Audit',
      extendedInfo: {
        formatter: 'Supported formatter',
        value: {
          a: 1
        }
      }
    }];

    const config = new Config(configJSON);
    assert.notEqual(config, configJSON);
    assert.ok(config.aggregations);
    assert.ok(config.auditResults);
    assert.deepStrictEqual(config.aggregations, configJSON.aggregations);
    assert.notEqual(config.aggregations, configJSON.aggregations);
    assert.notEqual(config.auditResults, configJSON.auditResults);
    assert.deepStrictEqual(config.auditResults, configJSON.auditResults);
  });

  it('returns filtered audits when a whitelist is given', () => {
    const config = new Config({
      audits: ['is-on-https']
    }, new Set(['b']));

    assert.ok(Array.isArray(config.audits));
    return assert.equal(config.audits.length, 0);
  });

  it('expands audits', () => {
    const config = new Config({
      audits: ['user-timings']
    });

    assert.ok(Array.isArray(config.audits));
    assert.equal(config.audits.length, 1);
    return assert.equal(typeof config.audits[0], 'function');
  });

  it('expands artifacts', () => {
    const config = new Config({
      artifacts: {
        traces: {
          defaultPass: path.resolve(__dirname, '../fixtures/traces/trace-user-timings.json')
        },
        performanceLog: path.resolve(__dirname, '../fixtures/perflog.json')
      }
    });
    const traceUserTimings = require('../fixtures/traces/trace-user-timings.json');
    assert.deepStrictEqual(config.artifacts.traces.defaultPass.traceEvents, traceUserTimings);
    assert.ok(config.artifacts.CriticalRequestChains);
    assert.ok(config.artifacts.CriticalRequestChains['93149.1']);
    assert.ok(config.artifacts.CriticalRequestChains['93149.1'].request);
    assert.ok(config.artifacts.CriticalRequestChains['93149.1'].children);
  });

  it('handles traces with no TracingStartedInPage events', () => {
    const config = new Config({
      artifacts: {
        traces: {
          defaultPass: path.resolve(__dirname,
                           '../fixtures/traces/trace-user-timings-no-tracingstartedinpage.json')
        },
        performanceLog: path.resolve(__dirname, '../fixtures/perflog.json')
      }
    });

    assert.ok(config.artifacts.traces.defaultPass.traceEvents.find(
          e => e.name === 'TracingStartedInPage' && e.args.data.page === '0xhad00p'));
  });

  it('doesnt add speedline artifact to tests without tti audit', () => {
    const config = new Config({
      artifacts: {
        traces: {
          defaultPass: path.resolve(__dirname,
                           '../fixtures/traces/trace-user-timings-no-tracingstartedinpage.json')
        },
        performanceLog: path.resolve(__dirname, '../fixtures/perflog.json')
      },
      audits: [
        'first-meaningful-paint'

      ]
    });

    assert.equal(config.artifacts.Speedline, undefined);
  });

  it('does add speedline artifact to tests without tti audit', () => {
    const config = new Config({
      artifacts: {
        traces: {
          defaultPass: path.resolve(__dirname,
                           '../fixtures/traces/trace-user-timings-no-tracingstartedinpage.json')
        },
        performanceLog: path.resolve(__dirname, '../fixtures/perflog.json')
      },
      audits: [
        'first-meaningful-paint',
        'time-to-interactive'
      ]
    });

    assert.notEqual(config.artifacts.Speedline, undefined);
  });
});

