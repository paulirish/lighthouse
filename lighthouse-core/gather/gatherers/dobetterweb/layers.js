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

/**
 * @fileoverview Gathers the layers information.
 */

'use strict';

const Gatherer = require('../gatherer');

/* global document */

/* istanbul ignore next */

function forcedChangeLayerTree() {
  const mockDiv = document.createElement('div');
  document.body.appendChild(mockDiv);
}

/* istanbul ignore next */

class Layers extends Gatherer {

  gathererLayer() {
    return new Promise((resolve) => {
      const scriptSrc = `(${forcedChangeLayerTree.toString()}())`;

      this.driver.once('LayerTree.layerTreeDidChange', (data) => {
        resolve(data.layers);
      });

      this.driver.evaluateAsync(scriptSrc).then(e => e);
    });
  }

  calculateMemory(layers) {
    // Chrome devtool protocal not support memory estimate. So I calculate memory refer to below url.
    // https://github.com/ChromeDevTools/devtools-frontend/blob/18c3293ee92e03f7b7c9f2a1d7ed879304e11c55/front_end/layers/LayerTreeModel.js#L434
    const bytesPerPixel = 4;
    return layers.map( e => {
      e.memory = e.width * e.height * bytesPerPixel;
      return e;
    });
  }

  findReason(layers) {
    const self = this;
    function asyncLoop(layers, index) {
      if( layers.length > index) {
        return self.driver.sendCommand('LayerTree.compositingReasons', {
          layerId: layers[index].layerId
        }).then(data => {
          layers[index].compositingReasons = data.compositingReasons;
          return asyncLoop(layers, index+1);
        }, _ => {
          layers[index].compositingReasons = [];
          return asyncLoop(layers, index+1);
        });
      }else{
        return Promise.resolve(layers);
      }
    }
    return asyncLoop(layers, 0);
  }

  findNodeId(data) {
    const backendNodeIds = data.filter(e => e.backendNodeId).map( e => e.backendNodeId);
    return this.driver.sendCommand('DOM.pushNodesByBackendIdsToFrontend', {
      backendNodeIds
    }).then(result => {
      return {
        layers: data,
        backendNodeIds,
        nodeIds: result.nodeIds
      };
    });
  }

  findDOMInfo(data) {
    const self = this;
    const nodeInfo = {};
    function asyncLoop(nodeIds, index, layers, backendNodeIds, nodeInfo) {
      if( nodeIds.length > index) {
        return self.driver.sendCommand('DOM.resolveNode', {
          nodeId: nodeIds[index]
        }).then(data => {
          nodeInfo[backendNodeIds[index]] = data.object.description;
          return asyncLoop(nodeIds, index+1, layers, backendNodeIds, nodeInfo);
        }, _ => {
          return asyncLoop(nodeIds, index+1, layers, backendNodeIds, nodeInfo);
        });
      }else{
        return Promise.resolve({layers, nodeInfo});
      }
    }
    return asyncLoop(data.nodeIds, 0, data.layers, data.backendNodeIds, nodeInfo);
  }

  organizeData(data) {
    const layerInfo = data.layers.map(e => {
      const id = (e.backendNodeId && data.nodeInfo[e.backendNodeId])?
                    data.nodeInfo[e.backendNodeId]:
                    '#'+e.layerId;
      const paintCount = e.paintCount;
      const memory = e.memory;
      const layerId = e.layerId;
      const parentLayerId = e.parentLayerId;
      const compositingReasons = e.compositingReasons;
      return {
        id,
        paintCount,
        memory,
        layerId,
        parentLayerId,
        compositingReasons,
        width: e.width,
        height: e.height
      };
    });
    return layerInfo;
  }

  /**
   * @param {!Object} options
   * @param {{networkRecords: !Array<!NetworkRecord>}} tracingData
   * @return {!Promise<!Array<{id: string, paintCount: number, layerId: number, parentLayerId: number, compositingReasons: <!Array<string>>, width: number, height: number}>>}
   */
  afterPass(options) {
    this.driver = options.driver;
    return this.driver.sendCommand('LayerTree.enable')
        .then((_) => this.gathererLayer())
        .then((data) => this.calculateMemory(data))
        .then((data) => this.findReason(data))
        .then((data) => this.findNodeId(data))
        .then((data) => this.findDOMInfo(data))
        .then((data) => this.organizeData(data));
  }
}

module.exports = Layers;
