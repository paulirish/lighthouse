/**
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

/* eslint-env mocha */

const Layers = require('../../../../gather/gatherers/dobetterweb/layers');
const layersGatherer = require('../../../fixtures/layers-gatherer.json');
const assert = require('assert');


describe('Layers', () => {
  let layers;
  const options = {
    url: 'http://google.com/',
    driver: {
      evaluateAsync: function() {
        return Promise.resolve();
      },
      sendCommand: function(command, param) {
        if(command === 'LayerTree.enable') {
          return Promise.resolve();
        }

        if(command === 'LayerTree.compositingReasons') {
          if(param.layerId === '87'||param.layerId === '75') {
            return Promise.resolve({'compositingReasons': ['assumedOverlap', 'overlap']});
          }
          return Promise.reject();
        }

        if(command === 'DOM.pushNodesByBackendIdsToFrontend') {
          return Promise.resolve({
            nodeIds: [1, 2, 3]
          });
        }

        if(command === 'DOM.resolveNode') {
          let desc;
          if(param.nodeId === 1) {
            desc = 'div#foo';
          }else if(param.nodeId === 1) {
            desc = 'span';
          }else if(param.nodeId === 1) {
            desc = 'li.bar';
          }
          return Promise.resolve({
            object: {
              description: desc
            }
          });
        }
      },
      once: function(command, callback) {
        if(command === 'LayerTree.layerTreeDidChange') {
          callback({
            layers: layersGatherer
          });
        }
      }
    }
  };

  beforeEach(() => {
    layers = new Layers();
  });

  it('returns an artifact', () => {
    return layers.afterPass(options).then(artifact => {
      assert.equal(artifact.length, 7);

      const overlap = artifact[3];
      assert.equal(overlap.id, 'div#foo');
      assert.ok(overlap.compositingReasons.includes('assumedOverlap'));
      assert.ok(overlap.compositingReasons.includes('overlap'));
      assert.equal(overlap.width * overlap.height * 4, overlap.memory);
      assert.deepEqual(
        Object.keys(overlap),
        ['id', 'paintCount', 'memory', 'layerId', 'parentLayerId',
          'compositingReasons', 'width', 'height']);
    });
  });
});
